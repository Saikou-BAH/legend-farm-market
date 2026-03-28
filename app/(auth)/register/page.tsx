'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { getPasswordValidationErrors } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setSuccessMessage(null)

    const passwordErrors = getPasswordValidationErrors(password)

    if (!fullName.trim() || !email.trim()) {
      setFormError('Renseigne au minimum ton nom complet, ton email et ton mot de passe.')
      return
    }

    if (passwordErrors.length > 0) {
      setFormError(`Mot de passe trop faible: ${passwordErrors.join(', ')}.`)
      return
    }

    if (password !== confirmPassword) {
      setFormError('La confirmation du mot de passe ne correspond pas.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          password,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; requiresEmailConfirmation?: boolean; next?: string }
        | null

      if (!response.ok) {
        const message = payload?.error || 'Creation du compte impossible.'
        setFormError(message)
        toast({
          variant: 'destructive',
          title: 'Inscription impossible',
          description: message,
        })
        setIsSubmitting(false)
        return
      }

      if (payload?.requiresEmailConfirmation) {
        setSuccessMessage(
          'Compte cree. Verifie ta boite mail pour confirmer ton inscription avant de te connecter.'
        )
        toast({
          title: 'Compte cree',
          description: 'Verifie ton email pour finaliser l inscription.',
        })
        setPassword('')
        setConfirmPassword('')
        setIsSubmitting(false)
        return
      }

      toast({
        title: 'Compte cree',
        description: 'Redirection vers ton espace client...',
      })
      window.location.assign(payload?.next || '/account/dashboard')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Une erreur inattendue est survenue.'

      setFormError(message)
      toast({
        variant: 'destructive',
        title: 'Inscription impossible',
        description: message,
      })
      setIsSubmitting(false)
    }
  }

  return (
    <main className="container flex min-h-[70vh] items-center justify-center py-16">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Creer mon compte</CardTitle>
          <CardDescription>
            Inscription client securisee avec creation du profil Legend Farm Shop.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {successMessage ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
              {successMessage}
            </div>
          ) : null}

          {formError ? (
            <div
              role="alert"
              className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {formError}
            </div>
          ) : null}

          <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="full_name">Nom complet</Label>
              <Input
                id="full_name"
                name="full_name"
                autoComplete="name"
                placeholder="Aissatou Diallo"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telephone</Label>
              <Input
                id="phone"
                name="phone"
                autoComplete="tel"
                placeholder="+224..."
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="email@exemple.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="confirm_password">Confirmer le mot de passe</Label>
              <Input
                id="confirm_password"
                name="confirm_password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground md:col-span-2">
              Le mot de passe doit contenir au moins 12 caracteres, avec une minuscule, une majuscule, un chiffre et un caractere special.
            </div>

            <div className="md:col-span-2">
              <Button className="w-full" type="submit" disabled={isSubmitting}>
                <Sparkles className="h-4 w-4" />
                {isSubmitting ? 'Creation...' : 'Creer mon compte client'}
              </Button>
            </div>
          </form>

          <p className="text-sm text-muted-foreground">
            Deja inscrit ?{' '}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Retour a la connexion
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
