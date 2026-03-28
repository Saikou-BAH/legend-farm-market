import Image from 'next/image'
import { Egg } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductVisualProps {
  name: string
  imageUrl?: string | null
  className?: string
  imageClassName?: string
  priority?: boolean
}

export function ProductVisual({
  name,
  imageUrl,
  className,
  imageClassName,
  priority = false,
}: ProductVisualProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(215,236,197,0.95),_rgba(255,255,255,0.7))]',
        className
      )}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`Produit Legend Farm: ${name}`}
          fill
          unoptimized
          priority={priority}
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          className={cn('object-cover', imageClassName)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Egg className="h-9 w-9" aria-hidden="true" />
          </div>
        </div>
      )}
    </div>
  )
}
