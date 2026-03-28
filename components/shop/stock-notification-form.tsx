'use client'

import { useState, useTransition } from 'react'
import { subscribeToStockNotification } from '@/lib/actions/stock-notifications'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'

interface StockNotificationFormProps {
  productId: string
  productName: string
}

export function StockNotificationForm({
  productId,
  productName,
}: StockNotificationFormProps) {
  const [isPending, startTransition] = useTransition()
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    startTransition(async () => {
      const result = await subscribeToStockNotification({
        productId,
        customerEmail,
        customerName,
      })

      if (!result.success) {
        toast({
          title: 'Notification non enregistree',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Alerte enregistree',
        description: `Nous vous previendrons quand ${productName} reviendra en stock.`,
      })
      setCustomerName('')
      setCustomerEmail('')
    })
  }

  return (
    <form className="grid gap-3 rounded-[1.25rem] border border-border/70 bg-muted/25 p-4" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <p className="text-sm font-medium">Disponible bientot ?</p>
        <p className="text-sm text-muted-foreground">
          Laissez votre email pour etre prevenu quand ce produit revient.
        </p>
      </div>

      <div className="grid gap-3">
        <div className="grid gap-2">
          <Label htmlFor="stock-alert-name">Nom</Label>
          <Input
            id="stock-alert-name"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            placeholder="Votre nom"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="stock-alert-email">Email</Label>
          <Input
            id="stock-alert-email"
            type="email"
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
            placeholder="vous@exemple.com"
            required
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Enregistrement...' : 'Me prevenir du retour'}
      </Button>
    </form>
  )
}
