import { CustomerManagementPanel } from '@/components/admin/customer-management-panel'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCustomerProfileById } from '@/lib/actions/customers'
import { adminAccessMessages } from '@/lib/shop-data'
import { formatDateTime, formatGNF, formatNumber } from '@/lib/utils'

export default async function AdminCustomerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { access, customer } = await getCustomerProfileById(id)

  if (access.status !== 'ready') {
    const state = adminAccessMessages[access.status]
    return <EmptyState title={state.title} description={state.description} />
  }

  if (!customer) {
    return (
      <EmptyState
        title="Client introuvable"
        description="Aucun client ne correspond a cet identifiant dans la base actuelle."
      />
    )
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <CustomerManagementPanel customer={customer} />

      <Card>
        <CardHeader>
          <CardTitle>Suivi du profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="rounded-2xl border border-border/70 px-4 py-3">
            <p className="mb-1 font-medium">Notes</p>
            <p className="text-muted-foreground">{customer.notes ?? 'Aucune note pour ce client.'}</p>
          </div>
          <div className="rounded-2xl border border-border/70 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Cree le</span>
              <span className="text-right">{formatDateTime(customer.created_at)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Mis a jour le</span>
              <span className="text-right">{formatDateTime(customer.updated_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
