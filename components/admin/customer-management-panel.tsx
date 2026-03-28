'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateAdminCustomer } from '@/lib/actions/admin-customers'
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
import type { CustomerProfile, CustomerType } from '@/types'

interface CustomerManagementPanelProps {
  customer: CustomerProfile
}

interface CustomerFormState {
  fullName: string
  phone: string
  customerType: CustomerType
  creditBalance: string
  creditLimit: string
  isBlacklisted: boolean
  notes: string
}

const customerTypes: CustomerType[] = [
  'individual',
  'retailer',
  'restaurant',
  'wholesaler',
  'hotel',
]

function createCustomerFormState(customer: CustomerProfile): CustomerFormState {
  return {
    fullName: customer.full_name,
    phone: customer.phone ?? '',
    customerType: customer.customer_type,
    creditBalance: String(customer.credit_balance),
    creditLimit: String(customer.credit_limit),
    isBlacklisted: customer.is_blacklisted,
    notes: customer.notes ?? '',
  }
}

export function CustomerManagementPanel({
  customer,
}: CustomerManagementPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<CustomerFormState>(
    createCustomerFormState(customer)
  )

  useEffect(() => {
    setForm(createCustomerFormState(customer))
  }, [customer])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    startTransition(async () => {
      const result = await updateAdminCustomer({
        id: customer.id,
        ...form,
        phone: form.phone,
        notes: form.notes,
      })

      if (!result.success) {
        toast({
          title: 'Client non mis a jour',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Client mis a jour',
        description: 'Le profil client a ete mis a jour dans le back-office.',
      })
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion du client</CardTitle>
        <CardDescription>
          Ajustez le segment, le credit et les notes internes du compte client.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="customer-admin-full-name">Nom complet</Label>
              <Input
                id="customer-admin-full-name"
                value={form.fullName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customer-admin-phone">Telephone</Label>
              <Input
                id="customer-admin-phone"
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="customer-admin-type">Type client</Label>
              <select
                id="customer-admin-type"
                value={form.customerType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    customerType: event.target.value as CustomerType,
                  }))
                }
                className="h-11 rounded-full border border-input bg-background px-4 text-sm"
              >
                {customerTypes.map((customerType) => (
                  <option key={customerType} value={customerType}>
                    {customerType}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customer-admin-credit-balance">Solde credit (GNF)</Label>
              <Input
                id="customer-admin-credit-balance"
                type="number"
                min="0"
                step="0.01"
                value={form.creditBalance}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    creditBalance: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customer-admin-credit-limit">Plafond credit (GNF)</Label>
              <Input
                id="customer-admin-credit-limit"
                type="number"
                min="0"
                step="0.01"
                value={form.creditLimit}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    creditLimit: event.target.value,
                  }))
                }
                required
              />
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-[1.25rem] border border-border/70 bg-muted/25 p-4 text-sm">
            <input
              type="checkbox"
              checked={form.isBlacklisted}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isBlacklisted: event.target.checked,
                }))
              }
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-muted-foreground">
              Marquer ce client comme bloque pour les nouvelles commandes ou
              interventions manuelles.
            </span>
          </label>

          <div className="grid gap-2">
            <Label htmlFor="customer-admin-notes">Notes internes</Label>
            <textarea
              id="customer-admin-notes"
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              rows={5}
              className="flex min-h-[8rem] w-full rounded-[1.25rem] border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Notes SAV, contexte commercial, avertissements logistiques..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Enregistrement...' : 'Enregistrer le client'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
