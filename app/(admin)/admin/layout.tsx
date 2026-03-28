import { AdminNav } from '@/components/layout/admin-nav'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="container space-y-8 py-12">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Back-office
        </p>
        <h1 className="font-serif text-4xl">Pilotage de la boutique</h1>
      </div>
      <AdminNav />
      {children}
    </main>
  )
}
