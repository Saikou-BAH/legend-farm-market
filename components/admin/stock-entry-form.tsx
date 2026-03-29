'use client'

import { useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PackagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { createStockEntry } from '@/lib/actions/admin-batches'
import type { AdminBatch } from '@/lib/actions/admin-batches'

interface StockEntryFormProps {
  batches: AdminBatch[]
}

const controlClass =
  'h-11 rounded-[0.9rem] border border-border/70 bg-white/86 text-sm focus-visible:ring-primary/25 focus-visible:ring-offset-0'

const selectClass =
  'h-11 w-full rounded-[0.9rem] border border-border/70 bg-white/86 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-0 disabled:opacity-50'

export function StockEntryForm({ batches }: StockEntryFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)

    startTransition(async () => {
      const result = await createStockEntry({
        flockBatchId: data.get('flockBatchId') as string,
        quantity: data.get('quantity') as string,
        unitCost: (data.get('unitCost') as string) || null,
        notes: (data.get('notes') as string) || null,
      })

      if (result.success) {
        toast({
          title: 'Stock enregistré',
          description: `+${result.data.quantityAdded} unités ajoutées. Le stock produit est mis à jour.`,
        })
        formRef.current?.reset()
        router.refresh()
      } else {
        toast({
          title: 'Erreur',
          description: result.error,
          variant: 'destructive',
        })
      }
    })
  }

  if (batches.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aucune bande active. Créez d&apos;abord une bande ci-dessus pour pouvoir enregistrer des entrées de stock.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enregistrer une entrée de stock</CardTitle>
        <p className="text-sm text-muted-foreground">
          Chaque entrée est liée à une bande précise. Le stock du produit correspondant
          est incrémenté automatiquement, et le suivi FIFO est activé.
        </p>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">

          {/* Bande */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="entry-batch">Bande source *</Label>
            <select
              id="entry-batch"
              name="flockBatchId"
              required
              disabled={isPending}
              className={selectClass}
            >
              <option value="">Sélectionnez une bande active</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} — {b.product_name} (restant : {b.remaining_quantity})
                </option>
              ))}
            </select>
          </div>

          {/* Quantité */}
          <div className="space-y-2">
            <Label htmlFor="entry-qty">Quantité reçue *</Label>
            <Input
              id="entry-qty"
              name="quantity"
              type="number"
              min="1"
              step="1"
              placeholder="ex : 30"
              required
              disabled={isPending}
              className={controlClass}
            />
          </div>

          {/* Coût unitaire */}
          <div className="space-y-2">
            <Label htmlFor="entry-cost">
              Coût unitaire (GNF){' '}
              <span className="text-muted-foreground text-xs">optionnel</span>
            </Label>
            <Input
              id="entry-cost"
              name="unitCost"
              type="number"
              min="0"
              step="1"
              placeholder="ex : 12 000"
              disabled={isPending}
              className={controlClass}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="entry-notes">
              Notes{' '}
              <span className="text-muted-foreground text-xs">optionnel</span>
            </Label>
            <Input
              id="entry-notes"
              name="notes"
              placeholder="Lot de ponte du matin, qualité A…"
              disabled={isPending}
              className={controlClass}
            />
          </div>

          <div className="md:col-span-2">
            <Button type="submit" disabled={isPending} className="gap-2">
              <PackagePlus className="h-4 w-4" />
              {isPending ? 'Enregistrement…' : 'Enregistrer l\'entrée'}
            </Button>
          </div>

        </form>
      </CardContent>
    </Card>
  )
}
