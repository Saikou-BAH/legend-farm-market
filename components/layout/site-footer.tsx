import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/80">
      <div className="container grid gap-6 py-10 md:grid-cols-3">
        <div className="space-y-3">
          <p className="font-serif text-xl font-semibold">Legend Farm Shop</p>
          <p className="text-sm text-muted-foreground">
            Oeufs, volailles et produits fermiers, avec une experience e-commerce
            pensee pour la vente directe et la livraison en Guinee.
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-semibold">Parcours</p>
          <Link
            href="/products"
            className="block text-muted-foreground hover:text-foreground"
          >
            Catalogue
          </Link>
          <Link href="/cart" className="block text-muted-foreground hover:text-foreground">
            Panier
          </Link>
          <Link
            href="/account/dashboard"
            className="block text-muted-foreground hover:text-foreground"
          >
            Mon compte
          </Link>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-semibold">Exploitation</p>
          <p className="text-muted-foreground">Conakry, Guinee</p>
          <p className="text-muted-foreground">contact@legendfarm.gn</p>
          <p className="text-muted-foreground">Livraison locale et retrait ferme</p>
        </div>
      </div>
    </footer>
  )
}
