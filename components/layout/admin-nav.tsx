'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Package, ShoppingCart, Users, Tag, Truck, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { href: '/admin/dashboard', label: 'Vue d ensemble', icon: ShoppingCart },
  { href: '/admin/products', label: 'Produits', icon: Package },
  { href: '/admin/orders', label: 'Commandes', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Clients', icon: Users },
  { href: '/admin/promotions', label: 'Promotions', icon: Tag },
  { href: '/admin/deliveries', label: 'Livraison', icon: Truck },
  { href: '/admin/loyalty', label: 'Fidelite', icon: Users },
  { href: '/admin/analytics', label: 'Analytics', icon: ShoppingCart },
  { href: '/admin/emails', label: 'Emails', icon: Tag },
  { href: '/admin/settings', label: 'Parametres', icon: Settings },
]

export function AdminNav() {
  const currentPath = usePathname()

  return (
    <nav className="grid gap-2 md:grid-cols-4 xl:grid-cols-9">
      {items.map((item) => {
        const Icon = item.icon
        const active =
          currentPath === item.href || currentPath.startsWith(`${item.href}/`)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors',
              active
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-border/70 bg-card hover:bg-accent'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
