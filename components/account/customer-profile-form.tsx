'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateCurrentCustomerProfile } from '@/lib/actions/customers'
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
import type { CustomerProfile } from '@/types'

interface CustomerProfileFormProps {
  profile: CustomerProfile
}

export function CustomerProfileForm({ profile }: CustomerProfileFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [fullName, setFullName] = useState(profile.full_name)
  const [phone, setPhone] = useState(profile.phone ?? '')

  useEffect(() => {
    setFullName(profile.full_name)
    setPhone(profile.phone ?? '')
  }, [profile.full_name, profile.phone])

  const isDirty = useMemo(() => {
    return (
      fullName.trim() !== profile.full_name ||
      phone.trim() !== (profile.phone ?? '')
    )
  }, [fullName, phone, profile.full_name, profile.phone])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    startTransition(async () => {
      const result = await updateCurrentCustomerProfile({
        fullName,
        phone,
      })

      if (!result.success) {
        toast({
          title: 'Profil non mis a jour',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Profil mis a jour',
        description: 'Vos informations client ont ete enregistrees.',
      })
      router.refresh()
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
      <Card>
        <CardHeader>
          <CardTitle>Informations du compte</CardTitle>
          <CardDescription>
            Mettez a jour votre nom et votre telephone. L email et le type de
            compte restent pilotages par l administration et l authentification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="customer-full-name">Nom complet</Label>
              <Input
                id="customer-full-name"
                name="fullName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
                required
                maxLength={120}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customer-phone">Telephone</Label>
              <Input
                id="customer-phone"
                name="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
                maxLength={40}
                placeholder="+224 ..."
              />
            </div>

            <div className="rounded-[1.25rem] border border-border/70 bg-muted/25 p-4 text-sm text-muted-foreground">
              Les changements sont appliques a votre profil client et seront
              repris au prochain checkout.
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={isPending || !isDirty}>
                {isPending ? 'Enregistrement...' : 'Enregistrer le profil'}
              </Button>
              {!isDirty ? (
                <span className="text-sm text-muted-foreground">
                  Aucune modification en attente.
                </span>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resume client</CardTitle>
          <CardDescription>
            Informations utiles rattachees a votre compte Legend Farm Shop.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Email de connexion</p>
            <p className="font-medium">{profile.email}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Type de compte</p>
            <Badge variant="secondary">{profile.customer_type}</Badge>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Niveau fidelite</p>
            <Badge>{profile.loyalty_level}</Badge>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Statut du compte</p>
            <Badge
              variant={profile.is_blacklisted ? 'outline' : 'secondary'}
              className={
                profile.is_blacklisted
                  ? 'border-destructive/40 text-destructive'
                  : undefined
              }
            >
              {profile.is_blacklisted ? 'Compte limite' : 'Compte actif'}
            </Badge>
          </div>

          <div className="rounded-[1.25rem] border border-border/70 bg-background p-4 text-sm text-muted-foreground">
            {profile.is_blacklisted
              ? "Votre compte comporte une limitation administrative. Contactez la ferme pour debloquer vos commandes."
              : 'Votre compte est pret pour vos prochaines commandes et suivis de livraison.'}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
