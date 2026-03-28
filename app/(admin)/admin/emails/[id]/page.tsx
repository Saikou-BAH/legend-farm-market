import { EmptyState } from '@/components/ui/empty-state'

export default async function AdminEmailDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <EmptyState
      title={`Campagne ${id}`}
      description="Le detail d'une campagne email apparaitra ici avec son contenu et ses statistiques."
    />
  )
}
