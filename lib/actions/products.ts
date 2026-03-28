'use server'

import { getCatalogProducts, getHomePageData } from '@/lib/actions/shop'

export async function getProductsCatalog() {
  return getCatalogProducts()
}

export async function getFeaturedProducts() {
  const data = await getHomePageData()

  return data.featuredProducts
}

export async function getProductById(id: string) {
  const { isConfigured, products } = await getCatalogProducts()

  return {
    isConfigured,
    product: products.find((product) => product.id === id) ?? null,
  }
}
