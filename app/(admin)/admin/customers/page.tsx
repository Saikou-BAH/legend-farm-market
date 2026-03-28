import Link from 'next/link'
import { CustomerSegmentBadge } from '@/components/admin/customer-segment-badge'
import { ProspectCreatePanel } from '@/components/admin/prospect-create-panel'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCustomersAdminList } from '@/lib/actions/customers'
import { adminAccessMessages } from '@/lib/shop-data'
import { formatGNF } from '@/lib/utils'

export default async function AdminCustomersPage() {
  const { access, customers } = await getCustomersAdminList()

  if (access.status !== 'ready') {
    const state = adminAccessMessages[access.status]

    return <EmptyState title={state.title} description={state.description} />
  }

  return (
    <div className="grid gap-6">
      <ProspectCreatePanel />

      <Card>
        <CardHeader>
          <CardTitle>Clients ({customers.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {customers.length > 0 ? (
            customers.map((customer) => (
              <Link
                key={customer.id}
                href={`/admin/customers/${customer.id}`}
                className="grid gap-2 rounded-2xl border border-border/70 p-4 hover:bg-muted/40 md:grid-cols-[1fr_0.6fr_0.4fr_0.5fr]"
              >
                <p className="font-medium">{customer.full_name}</p>
                <CustomerSegmentBadge type={customer.customer_type} />
                <p className="text-sm text-primary">{customer.loyalty_level}</p>
                <p className="font-medium">{formatGNF(customer.credit_balance)}</p>
              </Link>
            ))
          ) : (
            <EmptyState
              title="Aucun client pour le moment"
              description="Les profils clients se construiront au fil des inscriptions et commandes du shop."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
