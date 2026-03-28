'use server'

import { revalidatePath } from 'next/cache'
import {
  recordAdminActivity,
  requireAdminMutationContext,
} from '@/lib/admin-mutations'
import { sendBatchEmails } from '@/lib/email'
import type { ActionResult, CustomerType, LoyaltyLevel } from '@/types'

type EmailCampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'

const emailRoles = ['admin', 'manager'] as const
const customerTypes: CustomerType[] = [
  'individual',
  'retailer',
  'restaurant',
  'wholesaler',
  'hotel',
]
const customerLevels: LoyaltyLevel[] = ['bronze', 'silver', 'gold', 'platinum']
const emailStatuses: EmailCampaignStatus[] = [
  'draft',
  'scheduled',
  'sending',
  'sent',
  'cancelled',
]

function normalizeRequiredText(
  value: string | null | undefined,
  label: string,
  maxLength: number
) {
  const nextValue = value?.trim() ?? ''

  if (!nextValue) {
    throw new Error(`${label} est obligatoire.`)
  }

  return nextValue.slice(0, maxLength)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function normalizeCampaignHtml(value: string | null | undefined) {
  const content = normalizeRequiredText(value, 'Le contenu', 20_000)

  if (/[<>]/.test(content)) {
    return content
  }

  return content
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('')
}

function parseDateTime(value: string | null | undefined, label: string) {
  const nextValue = value?.trim() ?? ''

  if (!nextValue) {
    return null
  }

  const date = new Date(nextValue)

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} est invalide.`)
  }

  return date.toISOString()
}

function isCampaignStatus(value: string): value is EmailCampaignStatus {
  return emailStatuses.includes(value as EmailCampaignStatus)
}

function resolveCampaignFilter(segment: string) {
  if (segment === 'all') {
    return { column: null, value: null }
  }

  if (customerTypes.includes(segment as CustomerType)) {
    return { column: 'customer_type', value: segment }
  }

  if (customerLevels.includes(segment as LoyaltyLevel)) {
    return { column: 'loyalty_level', value: segment }
  }

  throw new Error(`Le segment ${segment} n'est pas supporte.`)
}

function revalidateEmailPaths(campaignId?: string) {
  revalidatePath('/admin/emails')

  if (campaignId) {
    revalidatePath(`/admin/emails/${campaignId}`)
  }
}

interface CampaignPayload {
  name: string
  subject: string
  contentHtml: string
  segment: string
  status: EmailCampaignStatus
  scheduledAt: string | null
}

function buildCampaignMutation(input: CampaignPayload) {
  if (!isCampaignStatus(input.status)) {
    throw new Error('Le statut de campagne est invalide.')
  }

  const segment = normalizeRequiredText(input.segment, 'Le segment', 80)
  resolveCampaignFilter(segment)

  return {
    name: normalizeRequiredText(input.name, 'Le nom de la campagne', 140),
    subject: normalizeRequiredText(input.subject, "L'objet", 160),
    content_html: normalizeCampaignHtml(input.contentHtml),
    segment,
    status: input.status,
    scheduled_at: parseDateTime(input.scheduledAt, 'La date planifiee'),
  }
}

export async function createAdminEmailCampaign(
  input: CampaignPayload
): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await requireAdminMutationContext([...emailRoles])

    if (!context.ok) {
      return { success: false, error: context.error }
    }

    const { data, error } = await context.supabase
      .from('email_campaigns')
      .insert(buildCampaignMutation(input))
      .select('id')
      .single()

    if (error || !data) {
      throw new Error(
        `Impossible de creer la campagne: ${error?.message ?? 'reponse vide'}`
      )
    }

    await recordAdminActivity({
      supabase: context.supabase,
      staffId: context.staff.id,
      action: 'email_campaign.created',
      entityType: 'email_campaign',
      entityId: data.id,
      summary: `Campagne email creee: ${input.name}`,
      metadata: {
        segment: input.segment,
        status: input.status,
      },
    })

    revalidateEmailPaths(data.id)

    return { success: true, data: { id: data.id } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Impossible de creer la campagne email.',
    }
  }
}

export async function updateAdminEmailCampaign(
  id: string,
  input: CampaignPayload
): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await requireAdminMutationContext([...emailRoles])

    if (!context.ok) {
      return { success: false, error: context.error }
    }

    const campaignId = id.trim()

    if (!campaignId) {
      return { success: false, error: 'La campagne cible est invalide.' }
    }

    const { error } = await context.supabase
      .from('email_campaigns')
      .update(buildCampaignMutation(input))
      .eq('id', campaignId)

    if (error) {
      throw new Error(`Impossible de mettre a jour la campagne: ${error.message}`)
    }

    await recordAdminActivity({
      supabase: context.supabase,
      staffId: context.staff.id,
      action: 'email_campaign.updated',
      entityType: 'email_campaign',
      entityId: campaignId,
      summary: `Campagne email mise a jour: ${input.name}`,
      metadata: {
        segment: input.segment,
        status: input.status,
      },
    })

    revalidateEmailPaths(campaignId)

    return { success: true, data: { id: campaignId } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Impossible de mettre a jour la campagne email.',
    }
  }
}

export async function sendAdminEmailCampaign(
  campaignId: string
): Promise<ActionResult<{ recipientsCount: number }>> {
  try {
    const context = await requireAdminMutationContext([...emailRoles])

    if (!context.ok) {
      return { success: false, error: context.error }
    }

    const id = campaignId.trim()

    if (!id) {
      return { success: false, error: 'La campagne cible est invalide.' }
    }

    const { data: campaign, error: campaignError } = await context.supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (campaignError || !campaign) {
      throw new Error(
        `Impossible de charger la campagne: ${campaignError?.message ?? 'introuvable'}`
      )
    }

    const filter = resolveCampaignFilter(campaign.segment)
    let recipientsQuery = context.supabase
      .from('customer_profiles')
      .select('email')

    if (filter.column && filter.value) {
      recipientsQuery = recipientsQuery.eq(filter.column, filter.value)
    }

    const { data: recipientsData, error: recipientsError } = await recipientsQuery

    if (recipientsError) {
      throw new Error(
        `Impossible de charger les destinataires: ${recipientsError.message}`
      )
    }

    const recipients = (recipientsData ?? [])
      .map((recipient) => recipient.email)
      .filter((email): email is string => typeof email === 'string' && email.trim().length > 0)

    if (recipients.length === 0) {
      return { success: false, error: 'Aucun destinataire ne correspond a ce segment.' }
    }

    await context.supabase
      .from('email_campaigns')
      .update({ status: 'sending' })
      .eq('id', id)

    for (let index = 0; index < recipients.length; index += 100) {
      const batch = recipients.slice(index, index + 100)

      const sendResult = await sendBatchEmails(
        batch.map((email) => ({
          to: email,
          subject: campaign.subject,
          html: campaign.content_html,
          tags: [
            { name: 'type', value: 'campaign' },
            { name: 'campaign', value: id.replace(/-/g, '_') },
          ],
        }))
      )

      if (!sendResult.success) {
        await context.supabase
          .from('email_campaigns')
          .update({ status: 'draft' })
          .eq('id', id)

        return {
          success: false,
          error:
            sendResult.error ??
            "Impossible d'envoyer cette campagne pour le moment.",
        }
      }
    }

    const sentAt = new Date().toISOString()

    const { error: updateError } = await context.supabase
      .from('email_campaigns')
      .update({
        status: 'sent',
        sent_at: sentAt,
        recipients_count: recipients.length,
      })
      .eq('id', id)

    if (updateError) {
      throw new Error(
        `La campagne est partie mais sa mise a jour a echoue: ${updateError.message}`
      )
    }

    await recordAdminActivity({
      supabase: context.supabase,
      staffId: context.staff.id,
      action: 'email_campaign.sent',
      entityType: 'email_campaign',
      entityId: id,
      summary: `Campagne email envoyee a ${recipients.length} destinataires`,
      metadata: {
        segment: campaign.segment,
        recipients_count: recipients.length,
      },
    })

    revalidateEmailPaths(id)

    return { success: true, data: { recipientsCount: recipients.length } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Impossible d'envoyer la campagne.",
    }
  }
}
