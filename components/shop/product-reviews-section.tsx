import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PublicProductReview } from '@/types'
import { formatDateTime } from '@/lib/utils'

interface ProductReviewsSectionProps {
  averageRating: number | null
  reviews: PublicProductReview[]
}

export function ProductReviewsSection({
  averageRating,
  reviews,
}: ProductReviewsSectionProps) {
  return (
    <Card className="surface-panel border-white/80">
      <CardHeader>
        <CardTitle>
          Avis clients
          {averageRating !== null ? ` - ${averageRating}/5` : ''}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-border/70 bg-white/72 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{review.customer_name ?? 'Client Legend Farm'}</p>
                  <p className="text-sm text-muted-foreground">
                    Avis publie le {formatDateTime(review.created_at)}
                  </p>
                </div>
                <p className="text-sm font-medium">{review.rating}/5</p>
              </div>
              {review.comment ? (
                <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
              ) : null}
              {review.admin_reply ? (
                <div className="mt-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm">
                  <p className="font-medium">Reponse de l equipe</p>
                  <p className="mt-1 text-muted-foreground">{review.admin_reply}</p>
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 bg-white/65 p-5 text-sm text-muted-foreground">
            Aucun avis public pour ce produit pour le moment.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
