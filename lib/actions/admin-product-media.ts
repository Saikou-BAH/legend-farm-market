'use server'

import { revalidatePath } from 'next/cache'
import { env } from '@/lib/env'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import {
  buildProductMediaPublicUrl,
  buildProductMediaStoragePath,
  extractProductMediaStoragePath,
  PRODUCT_MEDIA_BUCKET,
  validateProductMediaFile,
} from '@/lib/product-media'
import type { ActionResult, StaffProfile } from '@/types'

type AdminMediaAccessStatus =
  | 'misconfigured'
  | 'unauthenticated'
  | 'forbidden'
  | 'missing_service_role'
  | 'ready'

interface AdminMediaAccess {
  status: AdminMediaAccessStatus
  staff: StaffProfile | null
}

interface ProductMediaRecord {
  id: string
  name: string
  images: string[]
}

async function getAdminMediaAccess(): Promise<AdminMediaAccess> {
  if (!env.hasSupabase()) {
    return {
      status: 'misconfigured',
      staff: null,
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      status: 'unauthenticated',
      staff: null,
    }
  }

  const { data } = await supabase
    .from('staff_profiles')
    .select('id, full_name, email, phone, role, is_active, created_at, updated_at')
    .eq('id', user.id)
    .maybeSingle()

  if (!data || !data.is_active) {
    return {
      status: 'forbidden',
      staff: null,
    }
  }

  return {
    status: env.hasServiceRole() ? 'ready' : 'missing_service_role',
    staff: data as StaffProfile,
  }
}

async function requireAdminMediaClient() {
  const access = await getAdminMediaAccess()

  if (access.status !== 'ready') {
    throw new Error("Acces admin insuffisant pour gerer les medias produits.")
  }

  return createServiceClient()
}

async function getProductMediaRecord(productId: string) {
  const supabase = await requireAdminMediaClient()
  const { data, error } = await supabase
    .from('products')
    .select('id, name, images')
    .eq('id', productId)
    .maybeSingle()

  if (error) {
    throw new Error(`Impossible de charger le produit: ${error.message}`)
  }

  if (!data) {
    throw new Error("Produit introuvable.")
  }

  return {
    supabase,
    product: {
      id: data.id,
      name: data.name,
      images: Array.isArray(data.images) ? data.images : [],
    } satisfies ProductMediaRecord,
  }
}

async function persistProductImages(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  productId: string,
  images: string[]
) {
  const { error } = await supabase
    .from('products')
    .update({ images })
    .eq('id', productId)

  if (error) {
    throw new Error(`Impossible de mettre a jour les images produit: ${error.message}`)
  }
}

function revalidateProductMedia(productId: string) {
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${productId}`)
  revalidatePath('/products')
  revalidatePath(`/products/${productId}`)
  revalidatePath('/')
}

function moveImageInArray(images: string[], imageUrl: string, direction: 'left' | 'right') {
  const index = images.indexOf(imageUrl)

  if (index === -1) {
    throw new Error("Image introuvable dans ce produit.")
  }

  const targetIndex = direction === 'left' ? index - 1 : index + 1

  if (targetIndex < 0 || targetIndex >= images.length) {
    return images
  }

  const nextImages = [...images]
  const [image] = nextImages.splice(index, 1)
  nextImages.splice(targetIndex, 0, image)

  return nextImages
}

export async function uploadAdminProductImage(
  productId: string,
  formData: FormData
): Promise<ActionResult<{ images: string[]; uploadedUrl: string }>> {
  try {
    const fileEntry = formData.get('image')

    if (!(fileEntry instanceof File)) {
      return {
        success: false,
        error: "Aucun fichier image n'a ete fourni.",
      }
    }

    if (fileEntry.size === 0) {
      return {
        success: false,
        error: "Le fichier selectionne est vide.",
      }
    }

    const validationError = validateProductMediaFile(fileEntry)

    if (validationError) {
      return {
        success: false,
        error: validationError,
      }
    }

    const { product, supabase } = await getProductMediaRecord(productId)
    const storagePath = buildProductMediaStoragePath(productId, fileEntry.name)
    const fileBuffer = Buffer.from(await fileEntry.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from(PRODUCT_MEDIA_BUCKET)
      .upload(storagePath, fileBuffer, {
        contentType: fileEntry.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(
        `Impossible d'envoyer l'image dans Supabase Storage. Verifiez le bucket ${PRODUCT_MEDIA_BUCKET} et la migration de stockage.`
      )
    }

    const uploadedUrl = buildProductMediaPublicUrl(storagePath)
    const nextImages = [uploadedUrl, ...product.images]

    try {
      await persistProductImages(supabase, productId, nextImages)
    } catch (error) {
      await supabase.storage.from(PRODUCT_MEDIA_BUCKET).remove([storagePath])
      throw error
    }

    revalidateProductMedia(productId)

    return {
      success: true,
      data: {
        images: nextImages,
        uploadedUrl,
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Impossible d'ajouter l'image produit.",
    }
  }
}

export async function removeAdminProductImage(
  productId: string,
  imageUrl: string
): Promise<ActionResult<{ images: string[] }>> {
  try {
    const { product, supabase } = await getProductMediaRecord(productId)

    if (!product.images.includes(imageUrl)) {
      return {
        success: false,
        error: "Cette image n'est pas associee a ce produit.",
      }
    }

    const nextImages = product.images.filter((currentImage) => currentImage !== imageUrl)
    await persistProductImages(supabase, productId, nextImages)

    const storagePath = extractProductMediaStoragePath(imageUrl)

    if (storagePath) {
      await supabase.storage.from(PRODUCT_MEDIA_BUCKET).remove([storagePath])
    }

    revalidateProductMedia(productId)

    return {
      success: true,
      data: {
        images: nextImages,
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Impossible de supprimer l'image produit.",
    }
  }
}

export async function setAdminPrimaryProductImage(
  productId: string,
  imageUrl: string
): Promise<ActionResult<{ images: string[] }>> {
  try {
    const { product, supabase } = await getProductMediaRecord(productId)

    if (!product.images.includes(imageUrl)) {
      return {
        success: false,
        error: "Cette image n'est pas associee a ce produit.",
      }
    }

    const nextImages = [imageUrl, ...product.images.filter((currentImage) => currentImage !== imageUrl)]
    await persistProductImages(supabase, productId, nextImages)
    revalidateProductMedia(productId)

    return {
      success: true,
      data: {
        images: nextImages,
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Impossible de definir l'image principale.",
    }
  }
}

export async function moveAdminProductImage(
  productId: string,
  imageUrl: string,
  direction: 'left' | 'right'
): Promise<ActionResult<{ images: string[] }>> {
  try {
    const { product, supabase } = await getProductMediaRecord(productId)
    const nextImages = moveImageInArray(product.images, imageUrl, direction)
    await persistProductImages(supabase, productId, nextImages)
    revalidateProductMedia(productId)

    return {
      success: true,
      data: {
        images: nextImages,
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Impossible de reorganiser les images produit.",
    }
  }
}
