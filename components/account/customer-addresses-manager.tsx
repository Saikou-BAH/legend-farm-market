'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Pencil, Star, Trash2 } from 'lucide-react'
import {
  createCustomerAddress,
  deleteCustomerAddress,
  setDefaultCustomerAddress,
  updateCustomerAddress,
} from '@/lib/actions/customers'
import { Badge } from '@/components/ui/badge'
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
import type { CustomerAddress } from '@/types'

interface CustomerAddressesManagerProps {
  addresses: CustomerAddress[]
}

interface AddressFormState {
  label: string
  fullAddress: string
  city: string
  zone: string
  phone: string
  isDefault: boolean
}

const emptyFormState: AddressFormState = {
  label: '',
  fullAddress: '',
  city: '',
  zone: '',
  phone: '',
  isDefault: false,
}

function toFormState(address: CustomerAddress): AddressFormState {
  return {
    label: address.label ?? '',
    fullAddress: address.full_address,
    city: address.city,
    zone: address.zone,
    phone: address.phone ?? '',
    isDefault: address.is_default,
  }
}

export function CustomerAddressesManager({
  addresses,
}: CustomerAddressesManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [form, setForm] = useState<AddressFormState>(emptyFormState)

  const isEditing = editingAddressId !== null
  const defaultAddress = useMemo(
    () => addresses.find((address) => address.is_default) ?? null,
    [addresses]
  )

  const resetForm = () => {
    setEditingAddressId(null)
    setForm(emptyFormState)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    startTransition(async () => {
      const payload = {
        label: form.label,
        fullAddress: form.fullAddress,
        city: form.city,
        zone: form.zone,
        phone: form.phone,
        isDefault: form.isDefault,
      }

      const result = isEditing
        ? await updateCustomerAddress({
            id: editingAddressId,
            ...payload,
          })
        : await createCustomerAddress(payload)

      if (!result.success) {
        toast({
          title: isEditing ? 'Adresse non modifiee' : 'Adresse non ajoutee',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: isEditing ? 'Adresse mise a jour' : 'Adresse ajoutee',
        description:
          'Votre carnet d adresses a ete mis a jour pour les prochains checkouts.',
      })
      resetForm()
      router.refresh()
    })
  }

  const handleSetDefault = (addressId: string) => {
    startTransition(async () => {
      const result = await setDefaultCustomerAddress(addressId)

      if (!result.success) {
        toast({
          title: 'Adresse par defaut non modifiee',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Adresse par defaut mise a jour',
        description: 'Cette adresse sera proposee en priorite au checkout.',
      })
      router.refresh()
    })
  }

  const handleDelete = (addressId: string) => {
    const confirmed = window.confirm(
      'Supprimer definitivement cette adresse de livraison ?'
    )

    if (!confirmed) {
      return
    }

    startTransition(async () => {
      const result = await deleteCustomerAddress(addressId)

      if (!result.success) {
        toast({
          title: 'Adresse non supprimee',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Adresse supprimee',
        description: 'Le carnet d adresses a ete mis a jour.',
      })

      if (editingAddressId === addressId) {
        resetForm()
      }

      router.refresh()
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? "Modifier l'adresse" : 'Nouvelle adresse'}
          </CardTitle>
          <CardDescription>
            Enregistrez une adresse Maison, Bureau ou point de retrait pour
            accelerer la commande.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="address-label">Libelle</Label>
              <Input
                id="address-label"
                name="label"
                value={form.label}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    label: event.target.value,
                  }))
                }
                maxLength={60}
                placeholder="Maison, Bureau, Hotel..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address-full-address">Adresse complete</Label>
              <textarea
                id="address-full-address"
                name="fullAddress"
                value={form.fullAddress}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fullAddress: event.target.value,
                  }))
                }
                required
                maxLength={220}
                rows={4}
                className="flex min-h-[8rem] w-full rounded-[1.25rem] border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Quartier, rue, repere, immeuble, porte..."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="address-city">Ville</Label>
                <Input
                  id="address-city"
                  name="city"
                  value={form.city}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      city: event.target.value,
                    }))
                  }
                  required
                  maxLength={80}
                  placeholder="Conakry"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address-zone">Zone</Label>
                <Input
                  id="address-zone"
                  name="zone"
                  value={form.zone}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      zone: event.target.value,
                    }))
                  }
                  required
                  maxLength={80}
                  placeholder="Conakry Centre"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address-phone">Telephone de livraison</Label>
              <Input
                id="address-phone"
                name="phone"
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                maxLength={40}
                autoComplete="tel"
                placeholder="+224 ..."
              />
            </div>

            <label className="flex items-start gap-3 rounded-[1.25rem] border border-border/70 bg-muted/25 p-4 text-sm">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isDefault: event.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-muted-foreground">
                Utiliser cette adresse comme adresse par defaut pour les prochains
                checkouts.
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? 'Enregistrement...'
                  : isEditing
                    ? "Enregistrer l'adresse"
                    : "Ajouter l'adresse"}
              </Button>

              {isEditing ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={resetForm}
                >
                  Annuler la modification
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Carnet d adresses</CardTitle>
          <CardDescription>
            {defaultAddress
              ? `Adresse par defaut actuelle: ${defaultAddress.label ?? defaultAddress.city}.`
              : "Aucune adresse par defaut n'est encore definie."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {addresses.length > 0 ? (
            addresses.map((address) => (
              <Card key={address.id} className="border-border/70 shadow-none">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">
                          {address.label ?? 'Adresse de livraison'}
                        </p>
                        {address.is_default ? (
                          <Badge>Par defaut</Badge>
                        ) : (
                          <Badge variant="outline">Secondaire</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {address.full_address}
                      </p>
                    </div>
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>

                  <div className="grid gap-3 text-sm md:grid-cols-3">
                    <div>
                      <p className="text-muted-foreground">Ville</p>
                      <p className="mt-1 font-medium">{address.city}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Zone</p>
                      <p className="mt-1 font-medium">{address.zone}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Telephone</p>
                      <p className="mt-1 font-medium">
                        {address.phone ?? 'Non renseigne'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => {
                        setEditingAddressId(address.id)
                        setForm(toFormState(address))
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      Modifier
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant={address.is_default ? 'secondary' : 'outline'}
                      disabled={isPending || address.is_default}
                      onClick={() => handleSetDefault(address.id)}
                    >
                      <Star className="h-4 w-4" />
                      {address.is_default
                        ? 'Adresse par defaut'
                        : 'Definir par defaut'}
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={isPending}
                      onClick={() => handleDelete(address.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-6 text-sm text-muted-foreground">
                Aucune adresse n est encore enregistree. Ajoutez votre premiere
                adresse pour fluidifier le passage de commande.
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
