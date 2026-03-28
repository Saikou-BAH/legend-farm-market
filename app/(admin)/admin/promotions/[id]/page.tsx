import { EmptyState } from '@/components/ui/empty-state'

export default async function AdminPromotionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <EmptyState
      title={`Promotion ${id}`}
      description="Cette fiche recevra le detail des regles, plafonds et usages de la promotion."
    />
  )
}
