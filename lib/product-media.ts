import { env } from '@/lib/env'

export const PRODUCT_MEDIA_BUCKET = 'product-media'
export const PRODUCT_MEDIA_MAX_SIZE_BYTES = 8 * 1024 * 1024
export const PRODUCT_MEDIA_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
] as const

function slugify(value: string) {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'image'
}

function normalizeExtension(fileName: string) {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/)

  if (!match) {
    return 'jpg'
  }

  const extension = match[1]

  if (['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(extension)) {
    return extension === 'jpeg' ? 'jpg' : extension
  }

  return 'jpg'
}

export function validateProductMediaFile(file: File) {
  if (!PRODUCT_MEDIA_ALLOWED_MIME_TYPES.includes(file.type as (typeof PRODUCT_MEDIA_ALLOWED_MIME_TYPES)[number])) {
    return `Format non supporte. Utilisez JPG, PNG, WebP ou AVIF.`
  }

  if (file.size > PRODUCT_MEDIA_MAX_SIZE_BYTES) {
    return `Fichier trop lourd. La taille maximale autorisee est de 8 Mo.`
  }

  return null
}

export function buildProductMediaStoragePath(productId: string, fileName: string) {
  const extension = normalizeExtension(fileName)
  const baseName = fileName.replace(/\.[^.]+$/, '')

  return `products/${productId}/${Date.now()}-${crypto.randomUUID()}-${slugify(baseName)}.${extension}`
}

export function buildProductMediaPublicUrl(storagePath: string) {
  const encodedPath = storagePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return `${env.supabaseUrl()}/storage/v1/object/public/${PRODUCT_MEDIA_BUCKET}/${encodedPath}`
}

export function extractProductMediaStoragePath(publicUrl: string) {
  try {
    const url = new URL(publicUrl)
    const expectedPrefix = `/storage/v1/object/public/${PRODUCT_MEDIA_BUCKET}/`

    if (!url.pathname.startsWith(expectedPrefix)) {
      return null
    }

    return decodeURIComponent(url.pathname.slice(expectedPrefix.length))
  } catch {
    return null
  }
}
