import Link from 'next/link'
import { PromotionEditor } from '@/components/admin/promotion-editor'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPromotionsAdminList } from '@/lib/actions/promotions'
import { adminAccessMessages } from '@/lib/shop-data'

export default async function AdminPromotionsPage() {
  const { access, promotions } = await getPromotionsAdminList()

  if (access.status !== 'ready') {
    const state = adminAccessMessages[access.status]

    return <EmptyState title={state.title} description={state.description} />
  }

  return (
    <div className="space-y-6">
      <PromotionEditor />

      <Card>
        <CardHeader>
          <CardTitle>Promotions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {promotions.length > 0 ? (
            promotions.map((promotion) => (
              <Link
                key={promotion.id}
                href={`/admin/promotions/${promotion.id}`}
                className="block rounded-2xl border border-border/70 p-4"
              >
                <p className="font-medium">{promotion.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {promotion.code ?? 'Promotion automatique'} • {promotion.type}
                </p>
              </Link>
            ))
          ) : (
            <EmptyState
              title="Aucune promotion configuree"
              description="Les codes promo et promotions automatiques apparaitront ici des qu ils seront crees."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
