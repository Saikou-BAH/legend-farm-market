import Link from 'next/link'
import { ArrowLeft, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-5 py-20 text-center">
      <p className="font-serif text-7xl text-primary/25">404</p>
      <div className="space-y-2">
        <h1 className="font-serif text-4xl font-semibold">Page introuvable</h1>
        <p className="max-w-md text-muted-foreground">
          Cette page n existe pas encore dans la boutique ou a ete deplacee.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="outline">
          <Link href="/shop">
            <ArrowLeft className="h-4 w-4" />
            Retour a la boutique
          </Link>
        </Button>
        <Button asChild>
          <Link href="/">
            <Home className="h-4 w-4" />
            Accueil
          </Link>
        </Button>
      </div>
    </div>
  )
}
