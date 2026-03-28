'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { sendAdminEmailCampaign } from '@/lib/actions/admin-emails'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import type { EmailCampaign } from '@/types'

interface EmailCampaignSendPanelProps {
  campaign: EmailCampaign
}

export function EmailCampaignSendPanel({
  campaign,
}: EmailCampaignSendPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Envoi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-1">
          <p>Segment: {campaign.segment}</p>
          <p>Statut: {campaign.status}</p>
          <p>Destinataires deja touches: {campaign.recipients_count}</p>
        </div>

        <Button
          type="button"
          disabled={isPending}
          onClick={() => {
            const confirmed = window.confirm('Envoyer cette campagne maintenant ?')

            if (!confirmed) {
              return
            }

            startTransition(async () => {
              const result = await sendAdminEmailCampaign(campaign.id)

              if (!result.success) {
                toast({
                  title: 'Envoi impossible',
                  description: result.error,
                  variant: 'destructive',
                })
                return
              }

              toast({
                title: 'Campagne envoyee',
                description: `${result.data.recipientsCount} destinataire(s) ont ete cibles.`,
              })
              router.refresh()
            })
          }}
        >
          {isPending ? 'Envoi...' : 'Envoyer la campagne'}
        </Button>
      </CardContent>
    </Card>
  )
}
