'use client'

import { useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { createFlockBatch } from '@/lib/actions/admin-batches'
import type { Product } from '@/types'

interface BatchCreateFormProps {
  products: Product[]
}

const controlClass =
  'h-11 rounded-[0.9rem] border border-border/70 bg-white/86 text-sm focus-visible:ring-primary/25 focus-visible:ring-offset-0'

const selectClass =
  'h-11 w-full rounded-[0.9rem] border border-border/70 bg-white/86 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-0 disabled:opacity-50'

export function BatchCreateForm({ products }: BatchCreateFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    startTransition(async () => {
      const result = await createFlockBatch({
        productId: data.get('productId') as string,
        name: data.get('name') as string,
        batchDate: data.get('batchDate') as string,
        initialQuantity: data.get('initialQuantity') as string,
        costPerUnit: (data.get('costPerUnit') as string) || null,
        notes: (data.get('notes') as string) || null,
      })

      if (result.success) {
        toast({ title: 'Bande créée', description: 'La bande a bien été enregistrée.' })
        formRef.current?.reset()
        router.refresh()
      } else {
        toast({
          title: 'Erreur',
          description: result.error ?? 'Impossible de créer la bande.',
          variant: 'destructive',
        })
      }
    })
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouvelle bande</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">

          {/* Produit — optionnel, une bande peut couvrir plusieurs produits */}
          <div className="space-y-2">
            <Label htmlFor="batch-product">
              Produit principal{' '}
              <span className="text-muted-foreground text-xs">optionnel</span>
            </Label>
            <select
              id="batch-product"
              name="productId"
              disabled={isPending}
              className={selectClass}
            >
              <option value="">Tous produits / non précisé</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Le produit est précisé à chaque entrée de stock.
            </p>
          </div>

          {/* Nom de la bande */}
          <div className="space-y-2">
            <Label htmlFor="batch-name">Nom de la bande *</Label>
            <Input
              id="batch-name"
              name="name"
              placeholder="ex : Bande A — Janvier 2026"
              required
              disabled={isPending}
              className={controlClass}
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="batch-date">Date de mise en place *</Label>
            <Input
              id="batch-date"
              name="batchDate"
              type="date"
              defaultValue={today}
              required
              disabled={isPending}
              className={controlClass}
            />
          </div>

          {/* Quantité initiale — optionnelle, mise à jour automatiquement via les entrées de stock */}
          <div className="space-y-2">
            <Label htmlFor="batch-qty">
              Quantité initiale{' '}
              <span className="text-muted-foreground text-xs">optionnel</span>
            </Label>
            <Input
              id="batch-qty"
              name="initialQuantity"
              type="number"
              min="0"
              step="1"
              placeholder="ex : 500 (ou laisser vide)"
              disabled={isPending}
              className={controlClass}
            />
            <p className="text-xs text-muted-foreground">
              Mis à jour automatiquement à chaque entrée de stock enregistrée.
            </p>
          </div>

          {/* Coût unitaire */}
          <div className="space-y-2">
            <Label htmlFor="batch-cost">
              Coût unitaire (GNF) <span className="text-muted-foreground">optionnel</span>
            </Label>
            <Input
              id="batch-cost"
              name="costPerUnit"
              type="number"
              min="0"
              step="1"
              placeholder="ex : 12000"
              disabled={isPending}
              className={controlClass}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="batch-notes">
              Notes <span className="text-muted-foreground">optionnel</span>
            </Label>
            <Input
              id="batch-notes"
              name="notes"
              placeholder="Informations complémentaires…"
              disabled={isPending}
              className={controlClass}
            />
          </div>

          <div className="md:col-span-2">
            <Button type="submit" disabled={isPending} className="gap-2">
              <PlusCircle className="h-4 w-4" />
              {isPending ? 'Création en cours…' : 'Créer la bande'}
            </Button>
          </div>

        </form>
      </CardContent>
    </Card>
  )
}
