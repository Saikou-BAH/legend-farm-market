import type { Metadata } from 'next'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getStatsByFlockBatch } from '@/lib/actions/admin-stats'
import { formatGNF, formatNumber } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Bandes',
}

const statusLabel: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> =
  {
    active: { label: 'Active', variant: 'default' },
    depleted: { label: 'Épuisée', variant: 'outline' },
    archived: { label: 'Archivée', variant: 'secondary' },
  }

export default async function AdminBatchesPage() {
  const { access, stats: batches } = await getStatsByFlockBatch()

  if (access.status !== 'ready') {
    return (
      <EmptyState
        title="Bandes non disponibles"
        description="Connectez un compte staff actif avec la configuration Supabase admin complète."
      />
    )
  }

  const activeBatches = batches.filter((b) => b.status === 'active')
  const depletedBatches = batches.filter((b) => b.status !== 'active')

  return (
    <div className="space-y-8">

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Les bandes (flock batches) permettent de lier vos entrées de stock à un lot de
          production précis. Chaque vente tracée via un mouvement FIFO est reliée à la bande
          source.
        </p>
        <p className="text-sm text-muted-foreground">
          Pour créer une bande et ajouter des entrées de stock, utilisez le SQL Editor Supabase
          ou l&apos;API admin — l&apos;interface de création sera ajoutée prochainement.
        </p>
      </div>

      {/* Bandes actives */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl">
          Bandes actives{' '}
          <span className="font-sans text-lg font-normal text-muted-foreground">
            ({activeBatches.length})
          </span>
        </h2>

        {activeBatches.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeBatches.map((b) => {
              const progress =
                b.initial_quantity > 0
                  ? Math.round((b.consumed / b.initial_quantity) * 100)
                  : 0

              return (
                <Card key={b.batch_id} className="surface-panel border-white/80">
                  <CardHeader className="space-y-2 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg leading-tight">{b.batch_name}</CardTitle>
                      <Badge variant={statusLabel[b.status]?.variant ?? 'secondary'}>
                        {statusLabel[b.status]?.label ?? b.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {b.product_name} · {b.batch_date}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Consommé : {formatNumber(b.consumed)}</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl border border-border/70 bg-white/65 p-3">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">
                          Injecté
                        </p>
                        <p className="mt-1 font-semibold">{formatNumber(b.initial_quantity)}</p>
                      </div>
                      <div className="rounded-xl border border-border/70 bg-white/65 p-3">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">
                          Restant
                        </p>
                        <p
                          className={`mt-1 font-semibold ${b.remaining_quantity <= 5 ? 'text-amber-600' : 'text-primary'}`}
                        >
                          {formatNumber(b.remaining_quantity)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border/70 bg-white/65 p-3">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">
                          CA
                        </p>
                        <p className="mt-1 font-semibold text-sm">
                          {b.revenue_from_movements > 0 ? formatGNF(b.revenue_from_movements) : '—'}
                        </p>
                      </div>
                    </div>

                    {b.cost_per_unit != null && (
                      <p className="text-xs text-muted-foreground">
                        Coût unitaire : {formatGNF(b.cost_per_unit)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 bg-white/65 p-8 text-center">
            <p className="font-serif text-xl">Aucune bande active</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Créez votre première bande via le SQL Editor Supabase en insérant dans la table{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">flock_batches</code>.
            </p>
          </div>
        )}
      </section>

      {/* Bandes terminées/archivées */}
      {depletedBatches.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-serif text-2xl text-muted-foreground">
            Bandes terminées ({depletedBatches.length})
          </h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/70 text-left text-muted-foreground">
                      <th className="px-5 py-4 font-medium">Bande</th>
                      <th className="px-5 py-4 font-medium">Produit</th>
                      <th className="px-5 py-4 font-medium text-right">Injecté</th>
                      <th className="px-5 py-4 font-medium text-right">Vendu</th>
                      <th className="px-5 py-4 font-medium text-right">CA</th>
                      <th className="px-5 py-4 font-medium">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {depletedBatches.map((b) => (
                      <tr key={b.batch_id}>
                        <td className="px-5 py-4">
                          <p className="font-medium">{b.batch_name}</p>
                          <p className="text-xs text-muted-foreground">{b.batch_date}</p>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">{b.product_name}</td>
                        <td className="px-5 py-4 text-right">{formatNumber(b.initial_quantity)}</td>
                        <td className="px-5 py-4 text-right">{formatNumber(b.consumed)}</td>
                        <td className="px-5 py-4 text-right font-semibold">
                          {formatGNF(b.revenue_from_movements)}
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={statusLabel[b.status]?.variant ?? 'secondary'}>
                            {statusLabel[b.status]?.label ?? b.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Guide SQL */}
      <section className="space-y-3">
        <h2 className="font-serif text-2xl">Créer une bande (SQL)</h2>
        <Card className="bg-muted/30">
          <CardContent className="p-5">
            <p className="mb-3 text-sm text-muted-foreground">
              Exemple d&apos;insertion d&apos;une bande et d&apos;une entrée de stock associée :
            </p>
            <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-xs leading-6">
{`-- 1. Créer la bande
INSERT INTO flock_batches (product_id, name, batch_date, initial_quantity, remaining_quantity)
VALUES (
  '<uuid-produit>',
  'Bande A - Janvier 2026',
  '2026-01-15',
  500,   -- quantité initiale
  500    -- même valeur au départ
);

-- 2. Ajouter une entrée de stock liée à la bande
INSERT INTO stock_entries (product_id, flock_batch_id, quantity, remaining_qty)
VALUES (
  '<uuid-produit>',
  '<uuid-bande>',
  500,
  500
);`}
            </pre>
          </CardContent>
        </Card>
      </section>

    </div>
  )
}
