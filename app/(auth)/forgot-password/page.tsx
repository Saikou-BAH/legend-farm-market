'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Mail } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { sanitizeInternalPath } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function ForgotPasswordPageFallback() {
  return (
    <main className="container flex items-center justify-center py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Mot de passe oublie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
            Preparation du formulaire de reinitialisation...
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

function ForgotPasswordPageContent() {
  const searchParams = useSearchParams()
  const requestedNext = searchParams.get('next')
  const nextPath = sanitizeInternalPath(requestedNext, '/account/dashboard')
  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setSuccessMessage(null)

    if (!email.trim()) {
      setFormError('Renseigne ton adresse email.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, next: nextPath }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null

      if (!response.ok) {
        const message = payload?.error || 'Impossible d envoyer le lien.'
        setFormError(message)
        toast({
          variant: 'destructive',
          title: 'Envoi impossible',
          description: message,
        })
        setIsSubmitting(false)
        return
      }

      setSuccessMessage(
        requestedNext
          ? 'Si cette adresse existe, un email de reinitialisation a ete envoye. Une fois le mot de passe change, tu pourras revenir sur la page demandee.'
          : 'Si cette adresse existe, un email de reinitialisation a ete envoye.'
      )
      toast({
        title: 'Email envoye',
        description: 'Verifie ta boite de reception et tes spams.',
      })
      setIsSubmitting(false)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Une erreur inattendue est survenue.'

      setFormError(message)
      toast({
        variant: 'destructive',
        title: 'Envoi impossible',
        description: message,
      })
      setIsSubmitting(false)
    }
  }

  return (
    <main className="container flex items-center justify-center py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Mot de passe oublie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="client@legendfarm.gn"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              <Mail className="h-4 w-4" />
              {isSubmitting ? 'Envoi...' : 'Envoyer le lien de reinitialisation'}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground">
            Retour a la{' '}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              connexion
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotPasswordPageFallback />}>
      <ForgotPasswordPageContent />
    </Suspense>
  )
}
