'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { KeyRound, Loader2, ShieldAlert } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import {
  getDefaultAuthenticatedPath,
  getPasswordValidationErrors,
  mergeLegendFarmUserMetadata,
  readLegendFarmAuthState,
  sanitizeInternalPath,
} from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
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

function ResetPasswordPageFallback() {
  return (
    <main className="container flex min-h-[70vh] items-center justify-center py-16">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Definir un nouveau mot de passe</CardTitle>
          <CardDescription>Chargement du flux de reinitialisation...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/40 px-4 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparation de la page de reinitialisation...
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

function ResetPasswordPageContent() {
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isActive = true

    async function syncCurrentUser() {
      await supabase.auth.getSession()
      const { data } = await supabase.auth.getUser()

      if (!isActive) {
        return
      }

      setUser(data.user ?? null)
      setIsCheckingSession(false)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isActive) {
        return
      }

      if (session?.user) {
        setUser(session.user)
        setIsCheckingSession(false)
        return
      }

      const { data } = await supabase.auth.getUser()

      if (!isActive) {
        return
      }

      setUser(data.user ?? null)
      setIsCheckingSession(false)
    })

    void syncCurrentUser()

    return () => {
      isActive = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const authState = readLegendFarmAuthState(user)
  const forcedByMiddleware = searchParams.get('reason') === 'force_password_change'

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    const passwordErrors = getPasswordValidationErrors(password)

    if (!user) {
      setFormError('Aucune session de reinitialisation ou de connexion active n a ete detectee.')
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
      const nextMetadata = mergeLegendFarmUserMetadata(user.user_metadata, {
        userType: authState.userType,
        forcePasswordChange: false,
        passwordChangedAt: new Date().toISOString(),
      })

      const { data, error } = await supabase.auth.updateUser({
        password,
        data: nextMetadata,
      })

      if (error) {
        throw new Error(error.message)
      }

      await supabase.auth.refreshSession()

      const nextState = readLegendFarmAuthState(data.user ?? user)
      const fallbackPath = getDefaultAuthenticatedPath(nextState.userType)
      const nextPath = sanitizeInternalPath(searchParams.get('next'), fallbackPath)

      toast({
        title: 'Mot de passe mis a jour',
        description: 'Ta session reste active et ton acces est maintenant debloque.',
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
        title: 'Mise a jour impossible',
        description: message,
      })
      setIsSubmitting(false)
    }
  }

  return (
    <main className="container flex min-h-[70vh] items-center justify-center py-16">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Definir un nouveau mot de passe</CardTitle>
          <CardDescription>
            Ce formulaire fonctionne a la fois pour une reinitialisation securisee et pour un changement obligatoire apres mot de passe temporaire.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {forcedByMiddleware || authState.forcePasswordChange ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
              Tu dois definir un nouveau mot de passe avant de continuer a utiliser le site.
            </div>
          ) : null}

          {isCheckingSession ? (
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted/40 px-4 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verification de la session de reinitialisation...
            </div>
          ) : null}

          {!isCheckingSession && !user ? (
            <div className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Aucun lien de reinitialisation valide n a ete detecte, ou la session a expire.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline" size="sm">
                  <Link href="/forgot-password">Redemander un lien</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/login">Retour a la connexion</Link>
                </Button>
              </div>
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

          {user ? (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
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
              <div className="space-y-2">
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
              <div className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                Ton mot de passe doit contenir au moins 12 caracteres, avec une minuscule, une majuscule, un chiffre et un caractere special.
              </div>
              <Button className="w-full" type="submit" disabled={isSubmitting}>
                <KeyRound className="h-4 w-4" />
                {isSubmitting ? 'Mise a jour...' : 'Mettre a jour mon mot de passe'}
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordPageFallback />}>
      <ResetPasswordPageContent />
    </Suspense>
  )
}
