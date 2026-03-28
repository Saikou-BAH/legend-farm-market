import { PromotionEditor } from '@/components/admin/promotion-editor'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPromotionAdminById } from '@/lib/actions/promotions'
import { adminAccessMessages } from '@/lib/shop-data'
import { formatDateTime } from '@/lib/utils'

export default async function AdminPromotionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { access, promotion } = await getPromotionAdminById(id)

  if (access.status !== 'ready') {
    const state = adminAccessMessages[access.status]

    return <EmptyState title={state.title} description={state.description} />
  }

  if (!promotion) {
    return (
      <EmptyState
        title="Promotion introuvable"
        description="Cette promotion n est pas disponible dans le contexte admin actuel."
      />
    )
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
      <PromotionEditor promotion={promotion} />

      <Card>
        <CardHeader>
          <CardTitle>Suivi de la promotion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Code</span>
            <span className="text-right">{promotion.code ?? 'Automatique'}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Usages</span>
            <span className="text-right">{promotion.current_uses}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Active</span>
            <span className="text-right">{promotion.is_active ? 'Oui' : 'Non'}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Creee le</span>
            <span className="text-right">{formatDateTime(promotion.created_at)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
