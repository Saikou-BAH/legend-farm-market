import { redirect } from 'next/navigation'

export default function LegacyDeliveryPage() {
  redirect('/admin/deliveries')
}
