import { EmptyState } from '@/components/ui/empty-state'
import { CartSidebar } from '@/components/shop/cart-sidebar'

export default function CartPage() {
  return (
    <main className="container grid gap-8 py-12 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-5">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl">Panier</h1>
          <p className="text-muted-foreground">
            Structure de base pour les lignes de commande, les alveoles et les paliers tarifaires.
          </p>
        </div>

        <EmptyState
          title="Panier encore vide"
          description="Les lignes de panier, les paliers tarifaires et les frais de livraison seront calcules a partir des donnees en base des qu un client ajoute des produits."
        />
      </section>

      <CartSidebar itemCount={0} />
    </main>
  )
}
