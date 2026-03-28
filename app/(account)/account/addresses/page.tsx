import { EmptyState } from '@/components/ui/empty-state'
import { getCustomerAccount } from '@/lib/actions/customers'

export default async function AccountAddressesPage() {
  const { addresses, isAuthenticated, isConfigured } = await getCustomerAccount()

  if (!isConfigured || !isAuthenticated) {
    return (
      <EmptyState
        title="Adresses indisponibles"
        description="Connectez-vous avec un compte client pour gerer les adresses de livraison."
      />
    )
  }

  if (addresses.length === 0) {
    return (
      <EmptyState
        title="Aucune adresse enregistree"
        description="Ajoutez une adresse Maison, Bureau ou point de retrait pour accelerer le checkout."
      />
    )
  }

  return (
    <div className="space-y-4">
      {addresses.map((address) => (
        <div key={address.id} className="rounded-2xl border border-border/70 p-4">
          <p className="font-medium">{address.label ?? 'Adresse'}</p>
          <p className="mt-1 text-sm text-muted-foreground">{address.full_address}</p>
        </div>
      ))}
    </div>
  )
}
