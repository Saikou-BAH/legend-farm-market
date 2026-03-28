import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <main className="container py-12">
      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle className="font-serif text-4xl">Commande confirmee</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            La commande <span className="font-medium text-foreground">{id}</span> a bien
            ete enregistree. Cette page sera reliee a l email transactionnel et au recapitulatif detaille.
          </p>
          <Button asChild>
            <Link href={`/track/${id}`}>Suivre la commande</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
