'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { requireAdminMutationContext } from '@/lib/admin-mutations'
import { sendBatchEmails } from '@/lib/email'
import { renderStockAvailabilityEmail } from '@/lib/emails/stock-availability'
import { env } from '@/lib/env'
import { checkRateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

function normalizeRequiredText(
  value: string | null | undefined,
  label: string,
  maxLength: number
) {
  const nextValue = value?.trim() ?? ''

  if (!nextValue) {
    throw new Error(`${label} est obligatoire.`)
  }

  return nextValue.slice(0, maxLength)
}

function normalizeOptionalText(value: string | null | undefined, maxLength: number) {
  const nextValue = value?.trim() ?? ''
  return nextValue ? nextValue.slice(0, maxLength) : null
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function subscribeToStockNotification(input: {
  productId: string
  customerEmail: string
  customerName: string | null
}): Promise<ActionResult<{ created: true }>> {
  try {
    const productId = normalizeRequiredText(input.productId, 'Le produit', 80)
    const customerEmail = normalizeRequiredText(input.customerEmail, "L'email", 160)
      .toLowerCase()

    if (!isEmail(customerEmail)) {
      return {
        success: false,
        error: "L'adresse email est invalide.",
      }
    }

    const requestHeaders = await headers()
    const ip =
      requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      requestHeaders.get('x-real-ip') ??
      'unknown'

    const [rlEmail, rlIp] = await Promise.all([
      checkRateLimit({
        key: `stock-notification:email:${customerEmail}`,
        limit: 4,
        windowSeconds: 60 * 60,
      }),
      checkRateLimit({
        key: `stock-notification:ip:${ip}`,
        limit: 12,
        windowSeconds: 60 * 60,
      }),
    ])

    if (!rlEmail.allowed || !rlIp.allowed) {
      return {
        success: false,
        error: 'Trop de demandes ont deja ete faites pour ce produit. Reessayez plus tard.',
      }
    }

    const supabase = await createClient()

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, is_available, stock_quantity')
      .eq('id', productId)
      .maybeSingle()

    if (productError || !product) {
      throw new Error(
        `Impossible de verifier le produit cible: ${productError?.message ?? 'introuvable'}`
      )
    }

    if (product.is_available && (product.stock_quantity ?? 0) > 0) {
      return {
        success: false,
        error: 'Ce produit est deja disponible. Vous pouvez le commander tout de suite.',
      }
    }

    const { data: existingRow } = await supabase
      .from('stock_notifications')
      .select('id')
      .eq('product_id', productId)
      .eq('customer_email', customerEmail)
      .is('notified_at', null)
      .maybeSingle()

    if (existingRow) {
      return {
        success: true,
        data: {
          created: true,
        },
      }
    }

    const { error } = await supabase.from('stock_notifications').insert({
      product_id: productId,
      customer_email: customerEmail,
      customer_name: normalizeOptionalText(input.customerName, 120),
    })

    if (error) {
      throw new Error(`Impossible d'enregistrer la notification: ${error.message}`)
    }

    return {
      success: true,
      data: {
        created: true,
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Impossible de demander cette notification.',
    }
  }
}

export async function sendProductAvailabilityNotifications(
  productId: string
): Promise<ActionResult<{ sentCount: number }>> {
  try {
    const context = await requireAdminMutationContext(['admin', 'manager'])

    if (!context.ok) {
      return {
        success: false,
        error: context.error,
      }
    }

    const targetProductId = productId.trim()

    if (!targetProductId) {
      return {
        success: false,
        error: 'Le produit cible est invalide.',
      }
    }

    const [{ data: product, error: productError }, { data: subscribers, error: subscribersError }] =
      await Promise.all([
        context.supabase
          .from('products')
          .select('id, name, is_available, stock_quantity')
          .eq('id', targetProductId)
          .maybeSingle(),
        context.supabase
          .from('stock_notifications')
          .select('id, customer_email, customer_name')
          .eq('product_id', targetProductId)
          .is('notified_at', null),
      ])

    if (productError || !product) {
      throw new Error(
        `Impossible de charger le produit: ${productError?.message ?? 'introuvable'}`
      )
    }

    if (subscribersError) {
      throw new Error(
        `Impossible de charger les abonnements: ${subscribersError.message}`
      )
    }

    const pendingSubscribers = subscribers ?? []

    if (pendingSubscribers.length === 0) {
      return {
        success: true,
        data: {
          sentCount: 0,
        },
      }
    }

    const sendResult = await sendBatchEmails(
      pendingSubscribers.map((subscriber) => ({
        to: subscriber.customer_email,
        subject: `${product.name} est a nouveau disponible chez Legend Farm`,
        html: renderStockAvailabilityEmail({
          customerName: subscriber.customer_name,
          productName: product.name,
          productUrl: `${env.appUrl()}/products/${product.id}`,
        }),
        tags: [
          { name: 'type', value: 'stock-availability' },
          { name: 'product', value: product.id.replace(/-/g, '_') },
        ],
      }))
    )

    if (!sendResult.success) {
      return {
        success: false,
        error: sendResult.error ?? "Impossible d'envoyer les notifications.",
      }
    }

    const now = new Date().toISOString()

    const { error: updateError } = await context.supabase
      .from('stock_notifications')
      .update({ notified_at: now })
      .eq('product_id', targetProductId)
      .is('notified_at', null)

    if (updateError) {
      throw new Error(
        `Les emails sont partis mais la mise a jour des notifications a echoue: ${updateError.message}`
      )
    }

    revalidatePath(`/admin/products/${targetProductId}`)

    return {
      success: true,
      data: {
        sentCount: pendingSubscribers.length,
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Impossible d'envoyer les notifications.",
    }
  }
}
