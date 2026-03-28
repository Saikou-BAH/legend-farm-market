import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CheckoutPage() {
  return (
    <main className="container space-y-8 py-12">
      <div className="space-y-3">
        <Badge>Parcours protege</Badge>
        <h1 className="font-serif text-4xl">Checkout</h1>
        <p className="max-w-2xl text-muted-foreground">
          Cette page est deja prevue pour la connexion, l adresse de livraison,
          le creneau et le choix du mode de paiement.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Adresse</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Selection de l adresse client, zone et instructions de livraison.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Livraison</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Creneaux horaires, retrait ferme ou livraison selon la zone.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Paiement</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Orange Money, MTN Money, virement, cash a la livraison, credit ou points.
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
