'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createAdminProduct, updateAdminProduct } from '@/lib/actions/admin-products'
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
import type { Product } from '@/types'

interface ProductEditorProps {
  product?: Product
}

interface ProductFormState {
  name: string
  description: string
  category: string
  unit: string
  basePrice: string
  priceTier1Qty: string
  priceTier1Price: string
  priceTier2Qty: string
  priceTier2Price: string
  priceTier3Qty: string
  priceTier3Price: string
  stockQuantity: string
  stockAlertThreshold: string
  sortOrder: string
  isAvailable: boolean
  isFeatured: boolean
}

function createFormState(product?: Product): ProductFormState {
  return {
    name: product?.name ?? '',
    description: product?.description ?? '',
    category: product?.category ?? '',
    unit: product?.unit ?? '',
    basePrice: product ? String(product.base_price) : '',
    priceTier1Qty: product?.price_tier_1_qty?.toString() ?? '',
    priceTier1Price: product?.price_tier_1_price?.toString() ?? '',
    priceTier2Qty: product?.price_tier_2_qty?.toString() ?? '',
    priceTier2Price: product?.price_tier_2_price?.toString() ?? '',
    priceTier3Qty: product?.price_tier_3_qty?.toString() ?? '',
    priceTier3Price: product?.price_tier_3_price?.toString() ?? '',
    stockQuantity: product ? String(product.stock_quantity) : '0',
    stockAlertThreshold: product ? String(product.stock_alert_threshold) : '10',
    sortOrder: product ? String(product.sort_order) : '0',
    isAvailable: product?.is_available ?? true,
    isFeatured: product?.is_featured ?? false,
  }
}

export function ProductEditor({ product }: ProductEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<ProductFormState>(createFormState(product))

  useEffect(() => {
    setForm(createFormState(product))
  }, [product])

  const isEditing = Boolean(product)
  const title = isEditing ? 'Modifier le produit' : 'Creer un produit'

  const helperText = useMemo(() => {
    return isEditing
      ? "Mettez a jour les informations catalogue, prix et disponibilite sans quitter la fiche produit."
      : 'Creez un nouveau produit, puis ajoutez ses images depuis la fiche detail.'
  }, [isEditing])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    startTransition(async () => {
      const payload = {
        ...form,
        description: form.description,
        priceTier1Qty: form.priceTier1Qty || null,
        priceTier1Price: form.priceTier1Price || null,
        priceTier2Qty: form.priceTier2Qty || null,
        priceTier2Price: form.priceTier2Price || null,
        priceTier3Qty: form.priceTier3Qty || null,
        priceTier3Price: form.priceTier3Price || null,
      }

      const result = product
        ? await updateAdminProduct(product.id, payload)
        : await createAdminProduct(payload)

      if (!result.success) {
        toast({
          title: isEditing ? 'Produit non mis a jour' : 'Produit non cree',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: isEditing ? 'Produit mis a jour' : 'Produit cree',
        description: isEditing
          ? 'Le catalogue a ete mis a jour.'
          : 'Le produit a ete cree. Vous pouvez maintenant ajouter ses images.',
      })

      if (product) {
        router.refresh()
        return
      }

      router.push(`/admin/products/${result.data.id}`)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{helperText}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="product-name">Nom</Label>
              <Input
                id="product-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                required
                maxLength={140}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="product-category">Categorie</Label>
              <Input
                id="product-category"
                value={form.category}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    category: event.target.value,
                  }))
                }
                required
                maxLength={80}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="product-unit">Unite</Label>
              <Input
                id="product-unit"
                value={form.unit}
                onChange={(event) =>
                  setForm((current) => ({ ...current, unit: event.target.value }))
                }
                required
                maxLength={40}
                placeholder="plateau, kg, unite..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="product-base-price">Prix de base (GNF)</Label>
              <Input
                id="product-base-price"
                type="number"
                min="0"
                step="0.01"
                value={form.basePrice}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    basePrice: event.target.value,
                  }))
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="product-description">Description</Label>
            <textarea
              id="product-description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={5}
              maxLength={4000}
              className="flex min-h-[9rem] w-full rounded-[1.25rem] border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Description commerciale, conseils de conservation, qualite produit..."
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="grid gap-2 rounded-[1.25rem] border border-border/70 p-4">
              <p className="text-sm font-medium">Palier 1</p>
              <Input
                type="number"
                min="1"
                step="1"
                value={form.priceTier1Qty}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    priceTier1Qty: event.target.value,
                  }))
                }
                placeholder="Quantite"
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.priceTier1Price}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    priceTier1Price: event.target.value,
                  }))
                }
                placeholder="Prix GNF"
              />
            </div>

            <div className="grid gap-2 rounded-[1.25rem] border border-border/70 p-4">
              <p className="text-sm font-medium">Palier 2</p>
              <Input
                type="number"
                min="1"
                step="1"
                value={form.priceTier2Qty}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    priceTier2Qty: event.target.value,
                  }))
                }
                placeholder="Quantite"
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.priceTier2Price}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    priceTier2Price: event.target.value,
                  }))
                }
                placeholder="Prix GNF"
              />
            </div>

            <div className="grid gap-2 rounded-[1.25rem] border border-border/70 p-4">
              <p className="text-sm font-medium">Palier 3</p>
              <Input
                type="number"
                min="1"
                step="1"
                value={form.priceTier3Qty}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    priceTier3Qty: event.target.value,
                  }))
                }
                placeholder="Quantite"
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.priceTier3Price}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    priceTier3Price: event.target.value,
                  }))
                }
                placeholder="Prix GNF"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="product-stock">Stock visible</Label>
              <Input
                id="product-stock"
                type="number"
                min="0"
                step="1"
                value={form.stockQuantity}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    stockQuantity: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="product-alert-threshold">Seuil d alerte</Label>
              <Input
                id="product-alert-threshold"
                type="number"
                min="0"
                step="1"
                value={form.stockAlertThreshold}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    stockAlertThreshold: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="product-sort-order">Ordre d affichage</Label>
              <Input
                id="product-sort-order"
                type="number"
                min="0"
                step="1"
                value={form.sortOrder}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sortOrder: event.target.value,
                  }))
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-start gap-3 rounded-[1.25rem] border border-border/70 bg-muted/25 p-4 text-sm">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isAvailable: event.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-muted-foreground">
                Produit disponible a la vente sur la boutique.
              </span>
            </label>

            <label className="flex items-start gap-3 rounded-[1.25rem] border border-border/70 bg-muted/25 p-4 text-sm">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isFeatured: event.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-muted-foreground">
                Produit mis en avant sur la vitrine.
              </span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Enregistrement...'
                : isEditing
                  ? 'Enregistrer les changements'
                  : 'Creer le produit'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
