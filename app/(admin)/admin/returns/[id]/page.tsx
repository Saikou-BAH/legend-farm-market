import { EmptyState } from '@/components/ui/empty-state'

export default async function AdminReturnDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <EmptyState
      title={`Retour ${id}`}
      description="La fiche detail retour sera branchee a la table `returns` et a ses lignes `return_items`."
    />
  )
}
