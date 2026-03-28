import { OrderTimeline } from '@/components/shop/order-timeline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function TrackOrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <main className="container py-12">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle className="font-serif text-4xl">Suivi de commande</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Le suivi detaille de la commande <span className="font-medium text-foreground">{id}</span> sera alimente par le statut reel de la commande.
          </p>
          <OrderTimeline status="pending" />
        </CardContent>
      </Card>
    </main>
  )
}
