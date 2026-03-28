'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'
import { createAdminProspect } from '@/lib/actions/admin-customers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import type { CustomerType } from '@/types'

const customerTypeLabels: Record<CustomerType, string> = {
  individual: 'Particulier',
  retailer: 'Revendeur',
  restaurant: 'Restaurant',
  wholesaler: 'Grossiste',
  hotel: 'Hotel',
}

export function ProspectCreatePanel() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [customerType, setCustomerType] = useState<CustomerType>('individual')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await createAdminProspect({
        fullName,
        email: email.trim() || null,
        phone: phone.trim() || null,
        customerType,
        notes: notes.trim() || null,
      })

      if (!result.success) {
        setError(result.error)
        toast({ title: 'Erreur', description: result.error, variant: 'destructive' })
        return
      }

      toast({ title: 'Prospect cree', description: `${fullName} a ete ajoute a la base clients.` })
      router.push(`/admin/customers/${result.data.id}`)
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <UserPlus className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Ajouter un prospect</CardTitle>
            <CardDescription className="mt-1">
              Creez un contact client manuellement pour votre base de prospection.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prospect-name">Nom complet *</Label>
              <Input
                id="prospect-name"
                placeholder="Mamadou Diallo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prospect-type">Type de client *</Label>
              <select
                id="prospect-type"
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value as CustomerType)}
                disabled={isPending}
                className="flex h-10 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {(Object.entries(customerTypeLabels) as [CustomerType, string][]).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prospect-email">Email</Label>
              <Input
                id="prospect-email"
                type="email"
                placeholder="contact@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prospect-phone">Telephone</Label>
              <Input
                id="prospect-phone"
                placeholder="+224 6XX XX XX XX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prospect-notes">Notes / Contexte de prospection</Label>
            <textarea
              id="prospect-notes"
              placeholder="Restaurant du centre-ville, interesse par les plateaux d oeufs, a recontacter en avril..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isPending}
              rows={3}
              className="flex w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 resize-none"
            />
          </div>

          <Button type="submit" disabled={isPending || !fullName.trim()} className="w-full sm:w-auto">
            <UserPlus className="h-4 w-4" />
            {isPending ? 'Creation en cours...' : 'Ajouter le prospect'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
