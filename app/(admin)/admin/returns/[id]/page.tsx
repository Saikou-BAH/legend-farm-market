import { ReturnManagementPanel } from '@/components/admin/return-management-panel'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAdminReturnById } from '@/lib/actions/returns'
import { formatDateTime, formatGNF } from '@/lib/utils'

export default async function AdminReturnDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { access, returnRequest } = await getAdminReturnById(id)

  if (access.status !== 'ready') {
    return (
      <EmptyState
        title="Acces admin requis"
        description="Connectez-vous avec un compte staff actif pour consulter cette fiche retour."
      />
    )
  }

  if (!returnRequest) {
    return (
      <EmptyState
        title={`Retour ${id}`}
        description="Ce retour est introuvable ou n existe plus."
      />
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{returnRequest.reference}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Client</p>
            <p className="font-medium">{returnRequest.customer_name ?? 'Non renseigne'}</p>
            <p className="text-muted-foreground">
              {returnRequest.customer_email ?? 'Email non renseigne'}
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Commande</p>
            <p className="font-medium">{returnRequest.order_reference ?? 'Non reliee'}</p>
            <p className="text-muted-foreground">{formatDateTime(returnRequest.created_at)}</p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Motif</p>
            <p className="font-medium">{returnRequest.reason}</p>
            <p className="text-muted-foreground">
              {returnRequest.reason_details ?? 'Aucune precision'}
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-muted-foreground">Resolution</p>
            <p className="font-medium">{returnRequest.resolution ?? 'A definir'}</p>
            <p className="text-muted-foreground">
              {returnRequest.refund_amount !== null
                ? formatGNF(returnRequest.refund_amount)
                : 'Aucun montant'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lignes retournees</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {returnRequest.items.length > 0 ? (
            returnRequest.items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border/70 p-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium">{item.product_name ?? 'Produit non relie'}</p>
                  <p className="text-muted-foreground">
                    {item.quantity}
                    {item.product_unit ? ` x ${item.product_unit}` : ''}
                  </p>
                </div>
                <p className="mt-1 text-muted-foreground">
                  Quantite commandee: {item.order_item_quantity ?? 'n/a'}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucune ligne de retour n a ete rattachee a ce dossier.
            </p>
          )}
        </CardContent>
      </Card>

      <ReturnManagementPanel returnRequest={returnRequest} />
    </div>
  )
}
