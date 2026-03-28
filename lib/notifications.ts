'use server'

import { sendEmail } from '@/lib/email'
import { renderOrderConfirmationEmail } from '@/lib/emails/order-confirmation'
import { renderOrderStatusEmail } from '@/lib/emails/order-status'
import { renderWelcomeEmail } from '@/lib/emails/welcome'
import { env } from '@/lib/env'
import { formatGNF } from '@/lib/utils'

export async function sendOrderConfirmationNotification(input: {
  customerEmail: string
  customerName: string | null
  orderId: string
  reference: string
  totalAmount: number
}) {
  return sendEmail({
    to: input.customerEmail,
    subject: `Confirmation de votre commande ${input.reference}`,
    html: renderOrderConfirmationEmail({
      customerName: input.customerName,
      reference: input.reference,
      orderUrl: `${env.appUrl()}/order-confirmation/${input.orderId}`,
      totalAmountLabel: formatGNF(input.totalAmount),
    }),
    text: `Votre commande ${input.reference} a bien ete enregistree pour ${formatGNF(input.totalAmount)}. Suivi: ${env.appUrl()}/order-confirmation/${input.orderId}`,
    tags: [
      { name: 'type', value: 'order-confirmation' },
      { name: 'order', value: input.reference.replace(/[^a-zA-Z0-9]/g, '_') },
    ],
  })
}

export async function sendOrderStatusNotification(input: {
  customerEmail: string
  customerName: string | null
  orderId: string
  reference: string
  statusLabel: string
}) {
  return sendEmail({
    to: input.customerEmail,
    subject: `Suivi de votre commande ${input.reference}`,
    html: renderOrderStatusEmail({
      customerName: input.customerName,
      reference: input.reference,
      statusLabel: input.statusLabel,
      orderUrl: `${env.appUrl()}/track/${input.orderId}`,
    }),
    text: `La commande ${input.reference} est maintenant au statut ${input.statusLabel}. Suivi: ${env.appUrl()}/track/${input.orderId}`,
    tags: [
      { name: 'type', value: 'order-status' },
      { name: 'order', value: input.reference.replace(/[^a-zA-Z0-9]/g, '_') },
    ],
  })
}

export async function sendWelcomeNotification(input: {
  customerEmail: string
  customerName: string
}) {
  return sendEmail({
    to: input.customerEmail,
    subject: 'Bienvenue sur Legend Farm Shop',
    html: renderWelcomeEmail({
      customerName: input.customerName,
      accountUrl: `${env.appUrl()}/account/dashboard`,
    }),
    text: `Bienvenue sur Legend Farm Shop, ${input.customerName}. Retrouvez votre compte ici: ${env.appUrl()}/account/dashboard`,
    tags: [{ name: 'type', value: 'welcome' }],
  })
}
