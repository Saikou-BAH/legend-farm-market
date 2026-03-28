'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createAdminEmailCampaign,
  updateAdminEmailCampaign,
} from '@/lib/actions/admin-emails'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import type { EmailCampaign } from '@/types'

interface EmailCampaignEditorProps {
  campaign?: EmailCampaign
}

type EmailCampaignStatus = EmailCampaign['status']

interface EmailCampaignFormState {
  name: string
  subject: string
  contentHtml: string
  segment: string
  status: EmailCampaignStatus
  scheduledAt: string
}

const defaultSegments = [
  'all',
  'individual',
  'retailer',
  'restaurant',
  'wholesaler',
  'hotel',
  'bronze',
  'silver',
  'gold',
  'platinum',
] as const

function toDateTimeLocalValue(value: string | null) {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const timezoneOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

function createCampaignFormState(campaign?: EmailCampaign): EmailCampaignFormState {
  return {
    name: campaign?.name ?? '',
    subject: campaign?.subject ?? '',
    contentHtml: campaign?.content_html ?? '',
    segment: campaign?.segment ?? 'all',
    status: campaign?.status ?? 'draft',
    scheduledAt: toDateTimeLocalValue(campaign?.scheduled_at ?? null),
  }
}

export function EmailCampaignEditor({ campaign }: EmailCampaignEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<EmailCampaignFormState>(
    createCampaignFormState(campaign)
  )

  useEffect(() => {
    setForm(createCampaignFormState(campaign))
  }, [campaign])

  const isEditing = Boolean(campaign)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    startTransition(async () => {
      const payload = {
        ...form,
        scheduledAt: form.scheduledAt || null,
      }

      const result = campaign
        ? await updateAdminEmailCampaign(campaign.id, payload)
        : await createAdminEmailCampaign(payload)

      if (!result.success) {
        toast({
          title: isEditing ? 'Campagne non mise a jour' : 'Campagne non creee',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: isEditing ? 'Campagne mise a jour' : 'Campagne creee',
        description: 'La campagne email a ete enregistree.',
      })

      if (campaign) {
        router.refresh()
        return
      }

      router.push(`/admin/emails/${result.data.id}`)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Modifier la campagne' : 'Creer une campagne email'}
        </CardTitle>
        <CardDescription>
          Restez simple : objet clair, segment explicite, message utile et court.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="campaign-name">Nom interne</Label>
              <Input
                id="campaign-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="campaign-subject">Objet</Label>
              <Input
                id="campaign-subject"
                value={form.subject}
                onChange={(event) =>
                  setForm((current) => ({ ...current, subject: event.target.value }))
                }
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="campaign-segment">Segment</Label>
              <select
                id="campaign-segment"
                value={form.segment}
                onChange={(event) =>
                  setForm((current) => ({ ...current, segment: event.target.value }))
                }
                className="h-11 rounded-full border border-input bg-background px-4 text-sm"
              >
                {defaultSegments.map((segment) => (
                  <option key={segment} value={segment}>
                    {segment}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="campaign-status">Statut</Label>
              <select
                id="campaign-status"
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as EmailCampaignStatus,
                  }))
                }
                className="h-11 rounded-full border border-input bg-background px-4 text-sm"
              >
                <option value="draft">draft</option>
                <option value="scheduled">scheduled</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="campaign-scheduled-at">Planification</Label>
              <Input
                id="campaign-scheduled-at"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    scheduledAt: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="campaign-content">Contenu</Label>
            <textarea
              id="campaign-content"
              value={form.contentHtml}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  contentHtml: event.target.value,
                }))
              }
              rows={12}
              className="flex min-h-[14rem] w-full rounded-[1.25rem] border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Texte simple ou HTML de votre campagne."
            />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending
              ? 'Enregistrement...'
              : isEditing
                ? 'Enregistrer la campagne'
                : 'Creer la campagne'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
