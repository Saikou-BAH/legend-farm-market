import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background active:translate-y-px',
  {
    variants: {
      variant: {
        default:
          'bg-[linear-gradient(135deg,hsl(var(--primary))_0%,hsl(154_64%_19%)_100%)] text-primary-foreground shadow-[0_18px_40px_rgba(16,81,52,0.24)] hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(16,81,52,0.28)]',
        outline:
          'border border-border/80 bg-white/70 text-foreground shadow-[0_12px_28px_rgba(18,61,39,0.08)] backdrop-blur hover:-translate-y-0.5 hover:bg-white hover:text-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow-[0_14px_30px_rgba(120,154,54,0.12)] hover:-translate-y-0.5 hover:bg-secondary/85',
        ghost:
          'bg-transparent hover:bg-white/70 hover:text-foreground',
      },
      size: {
        default: 'h-11 px-5 py-2',
        sm: 'h-9 px-4 text-[0.82rem]',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
