'use client'

import * as React from 'react'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateAdminProductReview } from '@/lib/actions/reviews'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import type { AdminProductReview } from '@/types'
import { formatDateTime } from '@/lib/utils'

interface ProductReviewModerationProps {
  productName: string
  reviews: AdminProductReview[]
}

export function ProductReviewModeration({
  productName,
  reviews,
}: ProductReviewModerationProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle>Moderation des avis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <ProductReviewRow
              key={review.id}
              review={review}
              disabled={isPending}
              onModerate={(payload) => {
                startTransition(async () => {
                  const result = await updateAdminProductReview({
                    id: review.id,
                    isPublished: payload.isPublished,
                    adminReply: payload.adminReply,
                  })

                  if (!result.success) {
                    toast({
                      title: 'Moderation impossible',
                      description: result.error,
                      variant: 'destructive',
                    })
                    return
                  }

                  toast({
                    title: 'Avis mis a jour',
                    description: `La moderation du produit ${productName} a ete enregistree.`,
                  })
                  router.refresh()
                })
              }}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 p-5 text-sm text-muted-foreground">
            Aucun avis n a encore ete depose pour {productName}.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ProductReviewRow({
  review,
  disabled,
  onModerate,
}: {
  review: AdminProductReview
  disabled: boolean
  onModerate: (payload: { isPublished: boolean; adminReply: string | null }) => void
}) {
  return (
    <div className="rounded-2xl border border-border/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{review.customer_name ?? 'Client inconnu'}</p>
          <p className="text-sm text-muted-foreground">
            {review.customer_email ?? 'Email non renseigne'}
          </p>
          <p className="text-sm text-muted-foreground">
            {review.order_reference ? `${review.order_reference} - ` : ''}
            {formatDateTime(review.created_at)}
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="font-medium">{review.rating}/5</p>
          <p className="text-muted-foreground">
            {review.is_published ? 'Publie' : 'En attente'}
          </p>
        </div>
      </div>

      {review.comment ? (
        <p className="mt-3 text-sm text-muted-foreground">{review.comment}</p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Aucun commentaire detaille.</p>
      )}

      <ReviewReplyForm review={review} disabled={disabled} onModerate={onModerate} />
    </div>
  )
}

function ReviewReplyForm({
  review,
  disabled,
  onModerate,
}: {
  review: AdminProductReview
  disabled: boolean
  onModerate: (payload: { isPublished: boolean; adminReply: string | null }) => void
}) {
  const [adminReply, setAdminReply] = React.useState(review.admin_reply ?? '')
  const [isPublished, setIsPublished] = React.useState(review.is_published)

  return (
    <div className="mt-4 space-y-3">
      <label className="flex items-start gap-3 rounded-[1.25rem] border border-border/70 bg-muted/15 p-4 text-sm">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(event) => setIsPublished(event.target.checked)}
          disabled={disabled}
          className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        <span className="text-muted-foreground">
          Publier cet avis sur la fiche produit.
        </span>
      </label>

      <label className="space-y-2 text-sm">
        <span className="font-medium">Reponse admin</span>
        <textarea
          value={adminReply}
          onChange={(event) => setAdminReply(event.target.value)}
          disabled={disabled}
          className="flex min-h-[6rem] w-full rounded-[1.25rem] border border-input bg-background px-4 py-3 text-sm"
          placeholder="Remercier le client, preciser un contexte SAV, ou completer la reponse produit."
        />
      </label>

      <Button
        type="button"
        disabled={disabled}
        onClick={() =>
          onModerate({
            isPublished,
            adminReply,
          })
        }
      >
        {disabled ? 'Enregistrement...' : 'Enregistrer la moderation'}
      </Button>
    </div>
  )
}
