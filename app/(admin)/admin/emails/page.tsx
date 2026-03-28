import Link from 'next/link'
import { EmailCampaignEditor } from '@/components/admin/email-campaign-editor'
import { EmptyState } from '@/components/ui/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getEmailCampaigns } from '@/lib/actions/emails'
import { adminAccessMessages } from '@/lib/shop-data'

export default async function AdminEmailsPage() {
  const { access, campaigns } = await getEmailCampaigns()

  if (access.status !== 'ready') {
    const state = adminAccessMessages[access.status]

    return <EmptyState title={state.title} description={state.description} />
  }

  return (
    <div className="space-y-6">
      <EmailCampaignEditor />

      <Card>
        <CardHeader>
          <CardTitle>Campagnes email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {campaigns.length > 0 ? (
            campaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/admin/emails/${campaign.id}`}
                className="block rounded-2xl border border-border/70 p-4"
              >
                <p className="font-medium">{campaign.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {campaign.subject} • {campaign.segment} • {campaign.status}
                </p>
              </Link>
            ))
          ) : (
            <EmptyState
              title="Aucune campagne"
              description="Creez votre premiere campagne marketing ou informative."
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
