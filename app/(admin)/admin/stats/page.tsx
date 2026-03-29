import type { Metadata } from 'next'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCard } from '@/components/admin/stats-card'
import {
  getGlobalStats,
  getStatsByProduct,
  getStatsByCustomer,
  getStatsByFlockBatch,
} from '@/lib/actions/admin-stats'
import { formatGNF, formatNumber } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Statistiques',
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="space-y-1 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.round((value / Math.max(max, 1)) * 100)}%` }}
        />
      </div>
    </div>
  )
}

export default async function AdminStatsPage() {
  const [globalResult, productResult, customerResult, batchResult] = await Promise.all([
    getGlobalStats(),
    getStatsByProduct(),
    getStatsByCustomer(),
    getStatsByFlockBatch(),
  ])

  if (
    globalResult.access.status !== 'ready' ||
    productResult.access.status !== 'ready'
  ) {
    return (
      <EmptyState
        title="Statistiques non disponibles"
        description="Connectez un compte staff actif avec la configuration Supabase admin complète."
      />
    )
  }

  const { stats: global } = globalResult
  const { stats: products } = productResult
  const { stats: customers } = customerResult
  const { stats: batches } = batchResult

  const topProducts = [...products]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  const topCustomers = [...customers]
    .sort((a, b) => b.total_spent - a.total_spent)
    .slice(0, 10)

  const maxRevenue = Math.max(...topProducts.map((p) => p.revenue), 1)
  const maxSpent = Math.max(...topCustomers.map((c) => c.total_spent), 1)

  return (
    <div className="space-y-10">

      {/* ── Vue globale ── */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl">Vue globale</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatsCard
            label="Chiffre d'affaires"
            value={formatGNF(global.revenue)}
            detail="Commandes livrées ou payées"
          />
          <StatsCard
            label="Commandes"
            value={formatNumber(global.orders_count)}
            detail="Total toutes périodes"
          />
          <StatsCard
            label="Clients"
            value={formatNumber(global.customers_count)}
            detail="Profils enregistrés"
          />
          <StatsCard
            label="Bandes actives"
            value={formatNumber(global.active_batches)}
            detail="Flock batches en cours"
          />
          <StatsCard
            label="Valeur stock"
            value={formatGNF(global.total_stock_value)}
            detail="Valorisation au prix de base"
          />
        </div>
      </section>

      {/* ── Stats par produit ── */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl">Par produit</h2>
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Chiffre d&apos;affaires par produit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topProducts.length > 0 ? (
                topProducts.map((p) => (
                  <BarRow
                    key={p.product_id}
                    label={p.product_name}
                    value={p.revenue}
                    max={maxRevenue}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Aucune vente enregistrée.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Détail stock &amp; ventes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/70 text-left text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">Produit</th>
                      <th className="pb-3 pr-4 font-medium text-right">Vendus</th>
                      <th className="pb-3 pr-4 font-medium text-right">Stock</th>
                      <th className="pb-3 font-medium text-right">CA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {products.map((p) => (
                      <tr key={p.product_id}>
                        <td className="py-3 pr-4">
                          <p className="font-medium">{p.product_name}</p>
                          <p className="text-xs text-muted-foreground">{p.category}</p>
                        </td>
                        <td className="py-3 pr-4 text-right">{formatNumber(p.quantity_sold)}</td>
                        <td className="py-3 pr-4 text-right">{formatNumber(p.stock_quantity)}</td>
                        <td className="py-3 text-right font-semibold">{formatGNF(p.revenue)}</td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-muted-foreground">
                          Aucun produit.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Stats par client ── */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl">Par client</h2>
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top clients par dépenses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topCustomers.length > 0 ? (
                topCustomers.map((c) => (
                  <BarRow
                    key={c.customer_id}
                    label={c.full_name}
                    value={c.total_spent}
                    max={maxSpent}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Aucun client avec commandes.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Détail clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/70 text-left text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">Client</th>
                      <th className="pb-3 pr-4 font-medium text-right">Cmdes</th>
                      <th className="pb-3 pr-4 font-medium text-right">Panier moy.</th>
                      <th className="pb-3 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {topCustomers.map((c) => (
                      <tr key={c.customer_id}>
                        <td className="py-3 pr-4">
                          <p className="font-medium">{c.full_name}</p>
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        </td>
                        <td className="py-3 pr-4 text-right">{c.orders_count}</td>
                        <td className="py-3 pr-4 text-right">
                          {c.orders_count > 0
                            ? formatGNF(Math.round(c.total_spent / c.orders_count))
                            : '—'}
                        </td>
                        <td className="py-3 text-right font-semibold">{formatGNF(c.total_spent)}</td>
                      </tr>
                    ))}
                    {topCustomers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-muted-foreground">
                          Aucun client avec commandes.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Stats par bande ── */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl">Par bande</h2>
        <Card>
          <CardHeader>
            <CardTitle>Bandes &amp; production</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Bande</th>
                    <th className="pb-3 pr-4 font-medium">Produit</th>
                    <th className="pb-3 pr-4 font-medium text-right">Injecté</th>
                    <th className="pb-3 pr-4 font-medium text-right">Vendu</th>
                    <th className="pb-3 pr-4 font-medium text-right">Restant</th>
                    <th className="pb-3 font-medium text-right">CA généré</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {batches.map((b) => (
                    <tr key={b.batch_id}>
                      <td className="py-3 pr-4">
                        <p className="font-medium">{b.batch_name}</p>
                        <p className="text-xs text-muted-foreground">{b.batch_date}</p>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{b.product_name}</td>
                      <td className="py-3 pr-4 text-right">{formatNumber(b.initial_quantity)}</td>
                      <td className="py-3 pr-4 text-right">{formatNumber(b.consumed)}</td>
                      <td className="py-3 pr-4 text-right">
                        <span
                          className={
                            b.remaining_quantity === 0
                              ? 'text-muted-foreground'
                              : b.remaining_quantity <= 5
                                ? 'font-semibold text-amber-600'
                                : 'font-semibold text-primary'
                          }
                        >
                          {formatNumber(b.remaining_quantity)}
                        </span>
                      </td>
                      <td className="py-3 text-right font-semibold">
                        {formatGNF(b.revenue_from_movements)}
                      </td>
                    </tr>
                  ))}
                  {batches.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-muted-foreground">
                        Aucune bande enregistrée. Créez des bandes depuis la page Bandes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

    </div>
  )
}
