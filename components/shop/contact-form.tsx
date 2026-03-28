'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [company, setCompany] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          message,
          company,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Impossible d envoyer votre message.')
      }

      toast({
        title: 'Message envoye',
        description: 'Legend Farm a bien recu votre message.',
      })
      setFullName('')
      setEmail('')
      setPhone('')
      setMessage('')
      setCompany('')
    } catch (error) {
      toast({
        title: 'Envoi impossible',
        description:
          error instanceof Error
            ? error.message
            : 'Une erreur inattendue est survenue.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Envoyer un message</CardTitle>
        <CardDescription>
          Posez votre question, demandez un conseil ou preparez une commande
          speciale. Nous revenons vers vous par email ou telephone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="contact-full-name">Nom complet</Label>
              <Input
                id="contact-full-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="contact-phone">Telephone</Label>
              <Input
                id="contact-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                autoComplete="tel"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contact-company">Champ anti-spam</Label>
              <Input
                id="contact-company"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="contact-message">Message</Label>
            <textarea
              id="contact-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={6}
              required
              className="flex min-h-[10rem] w-full rounded-[1.25rem] border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Expliquez votre besoin, votre question ou votre demande de commande."
            />
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Envoi...' : 'Envoyer le message'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
