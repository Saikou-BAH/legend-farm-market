import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  return (
    <main className="container flex min-h-[70vh] items-center justify-center py-16">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Creer mon compte</CardTitle>
          <CardDescription>
            Inscription client avec points de bienvenue, type de client et adresses.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nom complet</Label>
            <Input id="full_name" placeholder="Aissatou Diallo" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telephone</Label>
            <Input id="phone" placeholder="+224..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="email@exemple.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          <div className="md:col-span-2">
            <Button className="w-full">
              <Sparkles className="h-4 w-4" />
              Creer mon compte client
            </Button>
          </div>
          <p className="md:col-span-2 text-sm text-muted-foreground">
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
