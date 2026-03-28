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

export async function sendAdminNewOrderNotification(input: {
  shopEmail: string
  customerName: string | null
  orderId: string
  reference: string
  totalAmount: number
  deliveryType: string
  itemsCount: number
}) {
  const adminOrderUrl = `${env.appUrl()}/admin/orders/${input.orderId}`
  const deliveryLabel = input.deliveryType === 'pickup' ? 'Retrait ferme' : 'Livraison'
  const customerLabel = input.customerName ?? 'Client inconnu'

  return sendEmail({
    to: input.shopEmail,
    subject: `Nouvelle commande ${input.reference} — ${formatGNF(input.totalAmount)}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#16a34a;margin-bottom:8px">Nouvelle commande recue</h2>
        <p style="color:#374151;margin-bottom:16px">Une commande vient d etre passee sur Legend Farm Shop.</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Reference</td><td style="padding:8px 0;font-weight:600">${input.reference}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Client</td><td style="padding:8px 0;font-weight:600">${customerLabel}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Articles</td><td style="padding:8px 0;font-weight:600">${input.itemsCount} article${input.itemsCount > 1 ? 's' : ''}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Mode</td><td style="padding:8px 0;font-weight:600">${deliveryLabel}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Total</td><td style="padding:8px 0;font-weight:700;color:#16a34a;font-size:18px">${formatGNF(input.totalAmount)}</td></tr>
        </table>
        <a href="${adminOrderUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Voir la commande dans l admin</a>
      </div>
    `,
    text: `Nouvelle commande ${input.reference} de ${customerLabel} — ${formatGNF(input.totalAmount)} (${deliveryLabel}). Voir: ${adminOrderUrl}`,
    tags: [
      { name: 'type', value: 'admin-new-order' },
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
