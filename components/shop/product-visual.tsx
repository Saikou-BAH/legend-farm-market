import Image from 'next/image'
import { Bird, Egg, Sprout } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductVisualProps {
  name: string
  imageUrl?: string | null
  className?: string
  imageClassName?: string
  priority?: boolean
  /** Disables the group-hover scale — used when the product is not purchasable */
  disableHoverScale?: boolean
}

export function ProductVisual({
  name,
  imageUrl,
  className,
  imageClassName,
  priority = false,
  disableHoverScale = false,
}: ProductVisualProps) {
  const normalizedName = name.toLowerCase()
  const FallbackIcon = normalizedName.includes('fiante')
    ? Sprout
    : normalizedName.includes('poulet')
      ? Bird
      : Egg

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(214,240,202,0.95),_rgba(250,252,247,0.78))]',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.18),transparent_48%,rgba(20,91,60,0.14))]" />
      <div className="pointer-events-none absolute -left-10 top-6 h-24 w-24 rounded-full bg-white/40 blur-2xl" />
      <div className="pointer-events-none absolute -right-12 bottom-0 h-28 w-28 rounded-full bg-primary/15 blur-2xl" />
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`Produit Legend Farm: ${name}`}
          fill
          unoptimized
          priority={priority}
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          className={cn(
            'object-cover transition-transform duration-500',
            !disableHoverScale && 'group-hover:scale-[1.03]',
            imageClassName
          )}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/70 bg-white/70 text-primary shadow-[0_18px_34px_rgba(17,78,49,0.12)] backdrop-blur">
            <FallbackIcon className="h-10 w-10" aria-hidden="true" />
          </div>
        </div>
      )}
    </div>
  )
}
