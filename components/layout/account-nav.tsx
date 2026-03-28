'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoutButton } from '@/components/auth/logout-button'
import { cn } from '@/lib/utils'

const items = [
  { href: '/account/dashboard', label: 'Dashboard' },
  { href: '/account/orders', label: 'Commandes' },
  { href: '/account/returns', label: 'Retours' },
  { href: '/account/addresses', label: 'Adresses' },
  { href: '/account/loyalty', label: 'Fidelite' },
  { href: '/account/reviews', label: 'Avis' },
  { href: '/account/profile', label: 'Profil' },
]

export function AccountNav() {
  const pathname = usePathname()

  return (
    <div className="space-y-3">
      <nav className="grid gap-2 md:grid-cols-4 xl:grid-cols-7">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-2xl border px-4 py-3 text-sm font-medium transition-colors',
              pathname === item.href || pathname.startsWith(`${item.href}/`)
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border/70 bg-card hover:bg-accent'
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="flex justify-end">
        <LogoutButton />
      </div>
    </div>
  )
}
