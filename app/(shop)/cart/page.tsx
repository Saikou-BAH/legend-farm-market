import type { Metadata } from 'next'
import { CartPageClient } from '@/components/shop/cart-page-client'

export const metadata: Metadata = {
  title: 'Panier',
  description:
    'Consultez les produits ajoutes au panier, ajustez les quantites et preparez votre checkout Legend Farm.',
}

export default function CartPage() {
  return <CartPageClient />
}
