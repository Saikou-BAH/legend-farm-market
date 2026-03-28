import { ShopSettingsManager } from '@/components/admin/shop-settings-manager'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAdminShopSettings } from '@/lib/actions/admin-shop'
import { adminAccessMessages } from '@/lib/shop-data'

export default async function AdminSettingsPage() {
  const { access, settings } = await getAdminShopSettings()

  if (access.status !== 'ready') {
    const state = adminAccessMessages[access.status]

    return <EmptyState title={state.title} description={state.description} />
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ShopSettingsManager settings={settings} />
      <Card>
        <CardHeader>
          <CardTitle>Automation</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Paniers abandonnes, notifications stock et campagnes email.
        </CardContent>
      </Card>
    </div>
  )
}
