import { AnalyticsExportButtons } from '@/components/admin/analytics-export-buttons'
import { StatsCard } from '@/components/admin/stats-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAnalyticsOverview } from '@/lib/actions/analytics'
import { formatGNF } from '@/lib/utils'

export default async function AdminAnalyticsPage() {
  const { access, ordersByStatus, paymentsByStatus, topCategories, totals } =
    await getAnalyticsOverview()

  if (access.status !== 'ready') {
    return (
      <EmptyState
        title="Analytics non disponible"
        description="Connectez un compte staff actif avec la configuration Supabase admin complète pour lire ce tableau de bord."
      />
    )
  }

  return (
    <div className="space-y-8">
      <AnalyticsExportButtons
        ordersByStatus={ordersByStatus}
        paymentsByStatus={paymentsByStatus}
        topCategories={topCategories}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatsCard
          label="Chiffre d'affaires"
          value={formatGNF(totals.revenue)}
          detail="Total basé sur les commandes livrées ou payées"
        />
        <StatsCard label="Commandes" value={`${totals.orders}`} detail="Commandes totalisées" />
        <StatsCard label="Clients" value={`${totals.customers}`} detail="Profils clients actifs" />
        <StatsCard label="Retours" value={`${totals.returns}`} detail="Demandes de retour enregistrées" />
        <StatsCard
          label="Promotions actives"
          value={`${totals.activePromotions}`}
          detail="Campagnes commerciales actuellement ouvertes"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Commandes par statut</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ordersByStatus.length > 0 ? (
              ordersByStatus.map((item) => {
                const maxValue = Math.max(...ordersByStatus.map((entry) => entry.value), 1)

                return (
                  <div key={item.label} className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(item.value / maxValue) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground">Aucune commande à analyser.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paiements par statut</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentsByStatus.length > 0 ? (
              paymentsByStatus.map((item) => {
                const maxValue = Math.max(...paymentsByStatus.map((entry) => entry.value), 1)

                return (
                  <div key={item.label} className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(item.value / maxValue) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground">Aucun paiement à analyser.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Catégories les plus présentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topCategories.length > 0 ? (
              topCategories.map((item) => {
                const maxValue = Math.max(...topCategories.map((entry) => entry.value), 1)

                return (
                  <div key={item.label} className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(item.value / maxValue) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground">Aucun produit à analyser.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
