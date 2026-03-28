'use server'

import { revalidatePath } from 'next/cache'
import {
  recordAdminActivity,
  requireAdminMutationContext,
} from '@/lib/admin-mutations'
import { env } from '@/lib/env'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type {
  ActionResult,
  AdminProductReview,
  CustomerProductReview,
  PublicProductReview,
  ReviewEligibilityItem,
  ReviewRating,
} from '@/types'

const reviewRoles = ['admin', 'manager', 'support'] as const
const allowedRatings: ReviewRating[] = [1, 2, 3, 4, 5]

function normalizeOptionalText(value: string | null | undefined, maxLength: number) {
  const nextValue = value?.trim() ?? ''
  return nextValue ? nextValue.slice(0, maxLength) : null
}

function isReviewRating(value: number): value is ReviewRating {
  return allowedRatings.includes(value as ReviewRating)
}

function mapProductReview(row: any) {
  return {
    id: row.id,
    product_id: row.product_id,
    customer_id: row.customer_id,
    order_id: row.order_id,
    rating: row.rating,
    comment: row.comment,
    is_verified: Boolean(row.is_verified),
    is_published: Boolean(row.is_published),
    admin_reply: row.admin_reply,
    created_at: row.created_at,
  }
}

export async function getCustomerReviews() {
  if (!env.hasSupabase()) {
    return {
      isConfigured: false,
      isAuthenticated: false,
      reviews: [] as CustomerProductReview[],
      eligibleItems: [] as ReviewEligibilityItem[],
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      isConfigured: true,
      isAuthenticated: false,
      reviews: [] as CustomerProductReview[],
      eligibleItems: [] as ReviewEligibilityItem[],
    }
  }

  const [ordersResult, reviewsResult] = await Promise.all([
    supabase
      .from('orders')
      .select('id, reference, delivered_at, status')
      .eq('customer_id', user.id)
      .in('status', ['delivered', 'returned'])
      .order('created_at', { ascending: false }),
    supabase
      .from('product_reviews')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const orders = ordersResult.data ?? []
  const orderIds = orders.map((order) => order.id)

  const itemsResult =
    orderIds.length > 0
      ? await supabase
          .from('order_items')
          .select('id, order_id, product_id, product_name, product_unit, quantity')
          .in('order_id', orderIds)
          .not('product_id', 'is', null)
          .order('created_at', { ascending: true })
      : { data: [], error: null }

  const mappedReviews = (reviewsResult.data ?? []).map((row) => mapProductReview(row))

  const orderReferenceById = new Map(orders.map((order) => [order.id, order.reference]))

  const reviews: CustomerProductReview[] = mappedReviews.map((review) => {
    const relatedItem = (itemsResult.data ?? []).find(
      (item) => item.order_id === review.order_id && item.product_id === review.product_id
    )

    return {
      ...review,
      product_name: relatedItem?.product_name ?? null,
      order_reference: review.order_id ? orderReferenceById.get(review.order_id) ?? null : null,
    }
  })

  const existingReviewsByOrderProduct = new Map(
    reviews
      .filter((review) => review.order_id && review.product_id)
      .map((review) => [`${review.order_id}:${review.product_id}`, review])
  )

  const deliveredOrderById = new Map(
    orders.map((order) => [order.id, { reference: order.reference, delivered_at: order.delivered_at }])
  )

  const eligibleItems: ReviewEligibilityItem[] = (itemsResult.data ?? []).map((item) => {
    const order = deliveredOrderById.get(item.order_id)
    const existingReview =
      item.product_id && order
        ? existingReviewsByOrderProduct.get(`${item.order_id}:${item.product_id}`) ?? null
        : null

    return {
      order_id: item.order_id,
      order_reference: order?.reference ?? 'Commande',
      order_item_id: item.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_unit: item.product_unit,
      quantity: item.quantity ?? 0,
      delivered_at: order?.delivered_at ?? null,
      existing_review: existingReview,
    }
  })

  return {
    isConfigured: true,
    isAuthenticated: true,
    reviews,
    eligibleItems,
  }
}

export async function upsertCustomerReview(input: {
  orderItemId: string
  rating: number
  comment: string | null
}): Promise<ActionResult<{ id: string }>> {
  try {
    if (!env.hasSupabase()) {
      return {
        success: false,
        error: "Supabase n'est pas configure pour gerer les avis.",
      }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: 'Connexion requise pour envoyer un avis.',
      }
    }

    if (!isReviewRating(input.rating)) {
      return {
        success: false,
        error: 'La note doit etre comprise entre 1 et 5.',
      }
    }

    const orderItemId = input.orderItemId.trim()

    if (!orderItemId) {
      return {
        success: false,
        error: "La ligne de commande cible est invalide.",
      }
    }

    const { data: orderItem, error: orderItemError } = await supabase
      .from('order_items')
      .select('id, order_id, product_id, product_name')
      .eq('id', orderItemId)
      .maybeSingle()

    if (orderItemError || !orderItem || !orderItem.product_id) {
      throw new Error(
        `Impossible de verifier la ligne de commande cible: ${orderItemError?.message ?? 'introuvable'}`
      )
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, customer_id')
      .eq('id', orderItem.order_id)
      .eq('customer_id', user.id)
      .maybeSingle()

    if (orderError || !order) {
      throw new Error(
        `Impossible de verifier la commande liee: ${orderError?.message ?? 'introuvable'}`
      )
    }

    if (!['delivered', 'returned'].includes(order.status)) {
      return {
        success: false,
        error: 'Seules les commandes livrees peuvent recevoir un avis.',
      }
    }

    const sanitizedComment = normalizeOptionalText(input.comment, 1600)

    const { data: existingReview } = await supabase
      .from('product_reviews')
      .select('id')
      .eq('customer_id', user.id)
      .eq('order_id', order.id)
      .eq('product_id', orderItem.product_id)
      .maybeSingle()

    if (existingReview) {
      const { error } = await supabase
        .from('product_reviews')
        .update({
          rating: input.rating,
          comment: sanitizedComment,
          is_published: false,
          admin_reply: null,
        })
        .eq('id', existingReview.id)

      if (error) {
        throw new Error(`Impossible de mettre a jour cet avis: ${error.message}`)
      }

      revalidatePath('/account/reviews')
      revalidatePath(`/products/${orderItem.product_id}`)

      return {
        success: true,
        data: { id: existingReview.id },
      }
    }

    const { data: createdReview, error: createError } = await supabase
      .from('product_reviews')
      .insert({
        product_id: orderItem.product_id,
        customer_id: user.id,
        order_id: order.id,
        rating: input.rating,
        comment: sanitizedComment,
        is_verified: true,
        is_published: false,
      })
      .select('id')
      .single()

    if (createError || !createdReview) {
      throw new Error(
        `Impossible de creer cet avis: ${createError?.message ?? 'reponse vide'}`
      )
    }

    revalidatePath('/account/reviews')
    revalidatePath(`/products/${orderItem.product_id}`)

    return {
      success: true,
      data: { id: createdReview.id },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Impossible d'enregistrer cet avis.",
    }
  }
}

export async function getPublicProductReviews(productId: string) {
  if (!env.hasSupabase()) {
    return {
      isConfigured: false,
      reviews: [] as PublicProductReview[],
      averageRating: null as number | null,
    }
  }

  const publicClient = await createClient()
  const { data: publicRows } = await publicClient
    .from('product_reviews')
    .select('*')
    .eq('product_id', productId)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const baseReviews = (publicRows ?? []).map((row) => mapProductReview(row))
  const averageRating =
    baseReviews.length > 0
      ? Number(
          (
            baseReviews.reduce((total, review) => total + review.rating, 0) / baseReviews.length
          ).toFixed(1)
        )
      : null

  if (!env.hasServiceRole() || baseReviews.length === 0) {
    return {
      isConfigured: true,
      reviews: baseReviews.map((review) => ({
        ...review,
        customer_name: null,
      })),
      averageRating,
    }
  }

  const serviceClient = await createServiceClient()
  const customerIds = Array.from(new Set(baseReviews.map((review) => review.customer_id)))
  const { data: customerRows } = await serviceClient
    .from('customer_profiles')
    .select('id, full_name')
    .in('id', customerIds)

  const customerNamesById = new Map(
    (customerRows ?? []).map((customer) => [customer.id, customer.full_name])
  )

  return {
    isConfigured: true,
    reviews: baseReviews.map((review) => ({
      ...review,
      customer_name: customerNamesById.get(review.customer_id) ?? null,
    })) as PublicProductReview[],
    averageRating,
  }
}

export async function getAdminProductReviews(productId: string) {
  const context = await requireAdminMutationContext([...reviewRoles])

  if (!context.ok) {
    return {
      access: {
        status: 'forbidden' as const,
        staff: null,
      },
      reviews: [] as AdminProductReview[],
    }
  }

  const [reviewsResult, customersResult, ordersResult] = await Promise.all([
    context.supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false }),
    context.supabase.from('customer_profiles').select('id, full_name, email'),
    context.supabase.from('orders').select('id, reference'),
  ])

  const customersById = new Map(
    (customersResult.data ?? []).map((customer) => [customer.id, customer])
  )
  const ordersById = new Map((ordersResult.data ?? []).map((order) => [order.id, order.reference]))

  return {
    access: {
      status: 'ready' as const,
      staff: context.staff,
    },
    reviews: (reviewsResult.data ?? []).map((row) => {
      const review = mapProductReview(row)
      const customer = customersById.get(review.customer_id)

      return {
        ...review,
        customer_name: customer?.full_name ?? null,
        customer_email: customer?.email ?? null,
        order_reference: review.order_id ? ordersById.get(review.order_id) ?? null : null,
        product_name: null,
      } satisfies AdminProductReview
    }),
  }
}

export async function updateAdminProductReview(input: {
  id: string
  isPublished: boolean
  adminReply: string | null
}): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await requireAdminMutationContext([...reviewRoles])

    if (!context.ok) {
      return {
        success: false,
        error: context.error,
      }
    }

    const reviewId = input.id.trim()

    if (!reviewId) {
      return {
        success: false,
        error: "L'avis cible est invalide.",
      }
    }

    const { data: existingReview, error: reviewError } = await context.supabase
      .from('product_reviews')
      .select('id, product_id')
      .eq('id', reviewId)
      .maybeSingle()

    if (reviewError || !existingReview) {
      throw new Error(
        `Impossible de charger cet avis: ${reviewError?.message ?? 'introuvable'}`
      )
    }

    const { error } = await context.supabase
      .from('product_reviews')
      .update({
        is_published: input.isPublished,
        admin_reply: normalizeOptionalText(input.adminReply, 1600),
      })
      .eq('id', reviewId)

    if (error) {
      throw new Error(`Impossible de moderer cet avis: ${error.message}`)
    }

    await recordAdminActivity({
      supabase: context.supabase,
      staffId: context.staff.id,
      action: 'review.updated',
      entityType: 'review',
      entityId: reviewId,
      summary: `Avis modere: ${reviewId}`,
      metadata: {
        is_published: input.isPublished,
      },
    })

    revalidatePath('/account/reviews')
    revalidatePath(`/products/${existingReview.product_id}`)
    revalidatePath(`/admin/products/${existingReview.product_id}`)

    return {
      success: true,
      data: { id: reviewId },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Impossible de moderer cet avis.",
    }
  }
}
