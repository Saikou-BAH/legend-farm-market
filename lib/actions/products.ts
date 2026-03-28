'use server'

import {
  getCatalogProductById,
  getCatalogProducts,
  getHomePageData,
} from '@/lib/actions/shop'
import { getAdminProductById as getAdminProductByIdInternal } from '@/lib/actions/admin-shop'

export async function getProductsCatalog(filters?: {
  search?: string | null
  category?: string | null
}) {
  return getCatalogProducts(filters)
}

export async function getFeaturedProducts() {
  const data = await getHomePageData()

  return data.featuredProducts
}

export async function getProductById(id: string) {
  return getCatalogProductById(id)
}

export async function getAdminProductById(id: string) {
  return getAdminProductByIdInternal(id)
}
