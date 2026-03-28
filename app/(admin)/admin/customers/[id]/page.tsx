import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCustomerProfileById } from '@/lib/actions/customers'

export default async function AdminCustomerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { access, customer } = await getCustomerProfileById(id)

  if (access.status !== 'ready') {
    return (
      <EmptyState
        title="Acces admin requis"
        description="Cette fiche client n est disponible que pour un compte staff actif."
      />
    )
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
    <Card>
      <CardHeader>
        <CardTitle>{customer.full_name}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Email</span>
          <span>{customer.email}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Type</span>
          <span>{customer.customer_type}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Niveau</span>
          <span>{customer.loyalty_level}</span>
        </div>
      </CardContent>
    </Card>
  )
}
