import Link from 'next/link'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAdminReturns } from '@/lib/actions/returns'
import { formatDateTime } from '@/lib/utils'

export default async function AdminReturnsPage() {
  const { access, returns } = await getAdminReturns()

  if (access.status !== 'ready') {
    return (
      <EmptyState
        title="Acces admin requis"
        description="Connectez-vous avec un compte staff actif pour gerer les retours."
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion des retours</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {returns.length > 0 ? (
          returns.map((returnRequest) => (
            <Link
              key={returnRequest.id}
              href={`/admin/returns/${returnRequest.id}`}
              className="block rounded-2xl border border-border/70 p-4 transition-colors hover:bg-accent/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{returnRequest.reference}</p>
                  <p className="text-sm text-muted-foreground">
                    {returnRequest.customer_name ?? 'Client non renseigne'} •{' '}
                    {returnRequest.order_reference ?? 'Commande non reliee'}
                  </p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p className="font-medium capitalize text-foreground">
                    {returnRequest.status}
                  </p>
                  <p>{formatDateTime(returnRequest.created_at)}</p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <EmptyState
            title="Aucun retour enregistre"
            description="Les demandes de retour client apparaitront ici des leur creation."
          />
        )}
      </CardContent>
    </Card>
  )
}
