import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getWhatsAppHref } from '@/lib/contact'

interface WhatsAppButtonProps {
  phone: string | null
  message?: string | null
  label?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function WhatsAppButton({
  phone,
  message,
  label = 'WhatsApp',
  variant = 'outline',
  size,
  className,
}: WhatsAppButtonProps) {
  const href = getWhatsAppHref(phone, message)

  if (!href) {
    return null
  }

  return (
    <Button asChild variant={variant} size={size} className={className}>
      <a href={href} target="_blank" rel="noreferrer">
        <MessageCircle className="h-4 w-4" />
        {label}
      </a>
    </Button>
  )
}
