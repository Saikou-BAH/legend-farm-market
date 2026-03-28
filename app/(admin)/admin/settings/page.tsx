import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAdminSettings } from '@/lib/actions/admin-shop'
import { adminAccessMessages } from '@/lib/shop-data'

export default async function AdminSettingsPage() {
  const { access, settings } = await getAdminSettings()

  if (access.status !== 'ready') {
    const state = adminAccessMessages[access.status]

    return <EmptyState title={state.title} description={state.description} />
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Parametres boutique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {settings.length > 0 ? (
            settings.map((setting) => (
              <div key={setting.id} className="rounded-2xl border border-border/70 p-4">
                <p className="font-medium text-foreground">{setting.key}</p>
                <p className="mt-1">{setting.value}</p>
                {setting.description ? <p className="mt-2 text-xs">{setting.description}</p> : null}
              </div>
            ))
          ) : (
            <EmptyState
              title="Aucun parametre charge"
              description="Les parametres de boutique inseres en base apparaitront ici."
            />
          )}
        </CardContent>
      </Card>
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
