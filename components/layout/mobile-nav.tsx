'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { WhatsAppButton } from '@/components/shop/whatsapp-button'
import { Button } from '@/components/ui/button'

interface MobileNavProps {
  phone: string | null
}

const navItems = [
  { href: '/', label: 'Accueil' },
  { href: '/products', label: 'Boutique' },
  { href: '/delivery', label: 'Livraison' },
  { href: '/contact', label: 'Contact' },
  { href: '/account/dashboard', label: 'Mon compte' },
]

export function MobileNav({ phone }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {open ? (
        <div className="absolute inset-x-0 top-full z-50 border-b border-border/70 bg-background/95 shadow-lg backdrop-blur md:hidden">
          <div className="container space-y-3 py-4">
            <nav className="grid gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border border-border/60 px-4 py-3 text-sm font-medium transition-colors hover:bg-accent"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            {phone ? (
              <WhatsAppButton
                phone={phone}
                label="Parler sur WhatsApp"
                message="Bonjour Legend Farm, j'aimerais avoir des informations."
                className="w-full justify-center"
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}
