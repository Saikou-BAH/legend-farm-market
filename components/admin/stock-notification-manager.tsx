'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { sendProductAvailabilityNotifications } from '@/lib/actions/stock-notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

interface StockNotificationManagerProps {
  productId: string
  productName: string
}

export function StockNotificationManager({
  productId,
  productName,
}: StockNotificationManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications stock</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-muted-foreground">
          Envoyez les alertes de retour en stock aux clients qui ont laisse leur
          email sur la fiche produit.
        </p>
        <Button
          type="button"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              const result = await sendProductAvailabilityNotifications(productId)

              if (!result.success) {
                toast({
                  title: 'Notifications non envoyees',
                  description: result.error,
                  variant: 'destructive',
                })
                return
              }

              toast({
                title: 'Notifications traitees',
                description:
                  result.data.sentCount > 0
                    ? `${result.data.sentCount} email(s) de retour en stock envoyes pour ${productName}.`
                    : "Aucun abonnee en attente sur ce produit.",
              })
              router.refresh()
            })
          }}
        >
          {isPending ? 'Envoi...' : 'Envoyer les alertes de retour en stock'}
        </Button>
      </CardContent>
    </Card>
  )
}
