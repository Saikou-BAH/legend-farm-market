import { CustomerSegmentBadge } from '@/components/admin/customer-segment-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCustomersAdminList } from '@/lib/actions/customers'
import { adminAccessMessages } from '@/lib/shop-data'
import { formatCurrency } from '@/lib/utils'

export default async function AdminCustomersPage() {
  const { access, customers } = await getCustomersAdminList()

  if (access.status !== 'ready') {
    const state = adminAccessMessages[access.status]

    return <EmptyState title={state.title} description={state.description} />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clients</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {customers.length > 0 ? (
          customers.map((customer) => (
            <div
              key={customer.id}
              className="grid gap-2 rounded-2xl border border-border/70 p-4 md:grid-cols-[1fr_0.6fr_0.4fr_0.5fr]"
            >
              <p className="font-medium">{customer.full_name}</p>
              <CustomerSegmentBadge type={customer.customer_type} />
              <p className="text-sm text-primary">{customer.loyalty_level}</p>
              <p className="font-medium">{formatCurrency(customer.credit_balance)}</p>
            </div>
          ))
        ) : (
          <EmptyState
            title="Aucun client pour le moment"
            description="Les profils clients se construiront au fil des inscriptions et commandes du shop."
          />
        )}
      </CardContent>
    </Card>
  )
}
