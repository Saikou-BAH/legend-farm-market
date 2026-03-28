'use client'

import { Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { sanitizeInternalPath } from '@/lib/auth'
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

const callbackErrorMessages: Record<string, string> = {
  callback_invalide: 'Le lien de connexion est invalide ou incomplet.',
  lien_invalide: 'Le lien de connexion ou de confirmation a expire.',
}

function LoginPageFallback() {
  return (
    <main className="container flex min-h-[70vh] items-center justify-center py-16">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
          <CardDescription>Chargement du formulaire de connexion...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
            Preparation de la page de connexion...
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

function LoginPageContent() {
  const searchParams = useSearchParams()
  const requestedNext = searchParams.get('next')
  const fallbackNextPath = sanitizeInternalPath(requestedNext, '/account/dashboard')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const infoMessage = useMemo(() => {
    if (searchParams.get('registered') === '1') {
      return 'Compte cree avec succes. Connecte-toi ou confirme ton email si Supabase t a envoye un lien.'
    }

    if (searchParams.get('logged_out') === '1') {
      return 'Ta session a ete fermee proprement.'
    }

    if (searchParams.get('password_reset') === '1') {
      return 'Ton mot de passe a ete mis a jour. Tu peux maintenant te reconnecter.'
    }

    const errorCode = searchParams.get('error')
    return errorCode ? callbackErrorMessages[errorCode] ?? null : null
  }, [searchParams])

  const infoIsError = Boolean(searchParams.get('error'))

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (!email.trim() || !password) {
      setFormError('Renseigne ton email et ton mot de passe.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; next?: string }
        | null

      if (!response.ok) {
        const message = payload?.error || 'Connexion impossible.'
        setFormError(message)
        toast({
          variant: 'destructive',
          title: 'Connexion impossible',
          description: message,
        })
        setIsSubmitting(false)
        return
      }

      const nextPath = sanitizeInternalPath(requestedNext, payload?.next || '/account/dashboard')

      toast({
        title: 'Connexion reussie',
        description: 'Redirection vers ton espace...',
      })
      window.location.assign(nextPath)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Une erreur inattendue est survenue.'

      setFormError(message)
      toast({
        variant: 'destructive',
        title: 'Connexion impossible',
        description: message,
      })
      setIsSubmitting(false)
    }
  }

  return (
    <main className="container flex min-h-[70vh] items-center justify-center py-16">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
          <CardDescription>
            Acces client et back-office via Supabase Auth, sans stockage local des mots de passe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {infoMessage ? (
            <div
              className={
                infoIsError
                  ? 'rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive'
                  : 'rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary'
              }
            >
              {infoMessage}
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

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="contact@legendfarm.gn"
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
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Connexion...' : 'Se connecter'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <Link
              href={`/forgot-password?next=${encodeURIComponent(fallbackNextPath)}`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Mot de passe oublie ?
            </Link>
            <span>
              Pas encore de compte ?{' '}
              <Link
                href="/register"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Creer un compte
              </Link>
            </span>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  )
}
