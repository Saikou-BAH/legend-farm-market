'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LogoutButtonProps {
  className?: string
  label?: string
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
}

export function LogoutButton({
  className,
  label = 'Se deconnecter',
  variant = 'outline',
  size = 'sm',
}: LogoutButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogout = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null

        throw new Error(payload?.error || 'Impossible de fermer la session.')
      }

      window.location.assign('/login?logged_out=1')
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Deconnexion impossible',
        description:
          error instanceof Error
            ? error.message
            : 'Une erreur inattendue est survenue.',
      })
      setIsSubmitting(false)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={handleLogout}
      disabled={isSubmitting}
    >
      <LogOut className="h-4 w-4" />
      {isSubmitting ? 'Deconnexion...' : label}
    </Button>
  )
}
