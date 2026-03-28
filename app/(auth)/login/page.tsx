import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  return (
    <main className="container flex min-h-[70vh] items-center justify-center py-16">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
          <CardDescription>
            Point d entree client et back-office. Le branchement Supabase viendra ici.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="contact@legendfarm.gn" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          <Button className="w-full">
            Se connecter
            <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-sm text-muted-foreground">
            Pas encore de compte client ?{' '}
            <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
              Creer un compte
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
