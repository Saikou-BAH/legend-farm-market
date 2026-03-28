'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createAdminPromotion,
  updateAdminPromotion,
} from '@/lib/actions/admin-promotions'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import type { Promotion, PromotionType } from '@/types'

interface PromotionEditorProps {
  promotion?: Promotion
}

interface PromotionFormState {
  name: string
  description: string
  type: PromotionType
  code: string
  value: string
  minOrderAmount: string
  maxUses: string
  maxUsesPerCustomer: string
  startsAt: string
  endsAt: string
  isActive: boolean
  isCumulative: boolean
  customerTypesCsv: string
  customerLevelsCsv: string
  productIdsCsv: string
  zonesCsv: string
}

const promotionTypes: PromotionType[] = [
  'percentage',
  'fixed_amount',
  'free_delivery',
  'buy_x_get_y',
  'bundle',
]

function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const timezoneOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

function createPromotionFormState(promotion?: Promotion): PromotionFormState {
  return {
    name: promotion?.name ?? '',
    description: promotion?.description ?? '',
    type: promotion?.type ?? 'percentage',
    code: promotion?.code ?? '',
    value: promotion ? String(promotion.value) : '',
    minOrderAmount: promotion ? String(promotion.min_order_amount) : '0',
    maxUses: promotion?.max_uses?.toString() ?? '',
    maxUsesPerCustomer: promotion ? String(promotion.max_uses_per_customer) : '1',
    startsAt: toDateTimeLocalValue(promotion?.starts_at ?? null),
    endsAt: toDateTimeLocalValue(promotion?.ends_at ?? null),
    isActive: promotion?.is_active ?? true,
    isCumulative: promotion?.is_cumulative ?? false,
    customerTypesCsv: promotion?.customer_types?.join(', ') ?? '',
    customerLevelsCsv: promotion?.customer_levels?.join(', ') ?? '',
    productIdsCsv: promotion?.product_ids?.join(', ') ?? '',
    zonesCsv: promotion?.zones?.join(', ') ?? '',
  }
}

export function PromotionEditor({ promotion }: PromotionEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<PromotionFormState>(
    createPromotionFormState(promotion)
  )

  useEffect(() => {
    setForm(createPromotionFormState(promotion))
  }, [promotion])

  const isEditing = Boolean(promotion)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    startTransition(async () => {
      const result = promotion
        ? await updateAdminPromotion(promotion.id, form)
        : await createAdminPromotion(form)

      if (!result.success) {
        toast({
          title: isEditing ? 'Promotion non mise a jour' : 'Promotion non creee',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: isEditing ? 'Promotion mise a jour' : 'Promotion creee',
        description: 'La configuration promotionnelle a ete enregistree.',
      })

      if (promotion) {
        router.refresh()
        return
      }

      router.push(`/admin/promotions/${result.data.id}`)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Modifier la promotion' : 'Creer une promotion'}
        </CardTitle>
        <CardDescription>
          Configurez les regles de base du coupon ou de la promotion automatique.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="promotion-name">Nom</Label>
              <Input
                id="promotion-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="promotion-code">Code promo</Label>
              <Input
                id="promotion-code"
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value }))
                }
                placeholder="LFS10 ou vide pour automatique"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="promotion-type">Type</Label>
              <select
                id="promotion-type"
                value={form.type}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    type: event.target.value as PromotionType,
                  }))
                }
                className="h-11 rounded-full border border-input bg-background px-4 text-sm"
              >
                {promotionTypes.map((promotionType) => (
                  <option key={promotionType} value={promotionType}>
                    {promotionType}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="promotion-value">Valeur</Label>
              <Input
                id="promotion-value"
                type="number"
                min="0"
                step="0.01"
                value={form.value}
                onChange={(event) =>
                  setForm((current) => ({ ...current, value: event.target.value }))
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="promotion-min-order">Minimum commande (GNF)</Label>
              <Input
                id="promotion-min-order"
                type="number"
                min="0"
                step="0.01"
                value={form.minOrderAmount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    minOrderAmount: event.target.value,
                  }))
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="promotion-starts-at">Debut</Label>
              <Input
                id="promotion-starts-at"
                type="datetime-local"
                value={form.startsAt}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    startsAt: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="promotion-ends-at">Fin</Label>
              <Input
                id="promotion-ends-at"
                type="datetime-local"
                value={form.endsAt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, endsAt: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="promotion-max-uses">Usages max</Label>
              <Input
                id="promotion-max-uses"
                type="number"
                min="0"
                step="1"
                value={form.maxUses}
                onChange={(event) =>
                  setForm((current) => ({ ...current, maxUses: event.target.value }))
                }
                placeholder="Vide = illimite"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="promotion-max-per-customer">Usages max par client</Label>
              <Input
                id="promotion-max-per-customer"
                type="number"
                min="0"
                step="1"
                value={form.maxUsesPerCustomer}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    maxUsesPerCustomer: event.target.value,
                  }))
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="promotion-description">Description</Label>
            <textarea
              id="promotion-description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={4}
              className="flex min-h-[7rem] w-full rounded-[1.25rem] border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="promotion-customer-types">Types clients cibles</Label>
              <Input
                id="promotion-customer-types"
                value={form.customerTypesCsv}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    customerTypesCsv: event.target.value,
                  }))
                }
                placeholder="individual, retailer"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="promotion-customer-levels">Niveaux cibles</Label>
              <Input
                id="promotion-customer-levels"
                value={form.customerLevelsCsv}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    customerLevelsCsv: event.target.value,
                  }))
                }
                placeholder="bronze, silver"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="promotion-product-ids">Produits cibles (UUID)</Label>
              <Input
                id="promotion-product-ids"
                value={form.productIdsCsv}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    productIdsCsv: event.target.value,
                  }))
                }
                placeholder="uuid1, uuid2"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="promotion-zones">Zones cibles</Label>
              <Input
                id="promotion-zones"
                value={form.zonesCsv}
                onChange={(event) =>
                  setForm((current) => ({ ...current, zonesCsv: event.target.value }))
                }
                placeholder="Conakry Centre, Coyah"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-start gap-3 rounded-[1.25rem] border border-border/70 bg-muted/25 p-4 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-muted-foreground">
                Promotion active et eligible si sa fenetre de validite est ouverte.
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-[1.25rem] border border-border/70 bg-muted/25 p-4 text-sm">
              <input
                type="checkbox"
                checked={form.isCumulative}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isCumulative: event.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-muted-foreground">
                Autoriser le cumul avec une autre promotion.
              </span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Enregistrement...'
                : isEditing
                  ? 'Enregistrer la promotion'
                  : 'Creer la promotion'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
