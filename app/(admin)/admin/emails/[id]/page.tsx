import { EmailCampaignEditor } from '@/components/admin/email-campaign-editor'
import { EmailCampaignSendPanel } from '@/components/admin/email-campaign-send-panel'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getEmailCampaignById } from '@/lib/actions/emails'
import { adminAccessMessages } from '@/lib/shop-data'
import { formatDateTime } from '@/lib/utils'

export default async function AdminEmailDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { access, campaign } = await getEmailCampaignById(id)

  if (access.status !== 'ready') {
    const state = adminAccessMessages[access.status]

    return <EmptyState title={state.title} description={state.description} />
  }

  if (!campaign) {
    return (
      <EmptyState
        title="Campagne introuvable"
        description="Cette campagne email n est pas disponible dans le contexte admin actuel."
      />
    )
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
      <EmailCampaignEditor campaign={campaign} />

      <div className="space-y-6">
        <EmailCampaignSendPanel campaign={campaign} />

        <Card>
          <CardHeader>
            <CardTitle>Suivi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Creee le</span>
              <span className="text-right">{formatDateTime(campaign.created_at)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Envoyee le</span>
              <span className="text-right">
                {campaign.sent_at ? formatDateTime(campaign.sent_at) : 'Pas encore'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Destinataires</span>
              <span className="text-right">{campaign.recipients_count}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
