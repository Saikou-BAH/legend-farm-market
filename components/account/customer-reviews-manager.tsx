'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { upsertCustomerReview } from '@/lib/actions/reviews'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import type { CustomerProductReview, ReviewEligibilityItem, ReviewRating } from '@/types'
import { formatDateTime } from '@/lib/utils'

interface CustomerReviewsManagerProps {
  eligibleItems: ReviewEligibilityItem[]
  reviews: CustomerProductReview[]
}

const ratingValues: ReviewRating[] = [5, 4, 3, 2, 1]

export function CustomerReviewsManager({
  eligibleItems,
  reviews,
}: CustomerReviewsManagerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [selectedOrderItemId, setSelectedOrderItemId] = useState(
    eligibleItems[0]?.order_item_id ?? ''
  )
  const selectedItem = useMemo(
    () => eligibleItems.find((item) => item.order_item_id === selectedOrderItemId) ?? null,
    [eligibleItems, selectedOrderItemId]
  )
  const [rating, setRating] = useState<ReviewRating>(
    selectedItem?.existing_review?.rating ?? 5
  )
  const [comment, setComment] = useState(selectedItem?.existing_review?.comment ?? '')

  function syncSelectedItem(nextOrderItemId: string) {
    const nextItem = eligibleItems.find((item) => item.order_item_id === nextOrderItemId) ?? null
    setSelectedOrderItemId(nextOrderItemId)
    setRating(nextItem?.existing_review?.rating ?? 5)
    setComment(nextItem?.existing_review?.comment ?? '')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Laisser ou modifier un avis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {eligibleItems.length > 0 ? (
            <>
              <label className="space-y-2 text-sm">
                <span className="font-medium">Produit livre</span>
                <select
                  value={selectedOrderItemId}
                  onChange={(event) => syncSelectedItem(event.target.value)}
                  className="flex h-11 w-full rounded-2xl border border-input bg-background px-4 py-2 text-sm"
                >
                  {eligibleItems.map((item) => (
                    <option key={item.order_item_id} value={item.order_item_id}>
                      {item.product_name} - {item.order_reference}
                    </option>
                  ))}
                </select>
              </label>

              {selectedItem ? (
                <div className="rounded-2xl border border-border/70 bg-muted/15 p-4 text-sm">
                  <p className="font-medium">{selectedItem.product_name}</p>
                  <p className="mt-1 text-muted-foreground">
                    Commande {selectedItem.order_reference} - livree le{' '}
                    {selectedItem.delivered_at
                      ? formatDateTime(selectedItem.delivered_at)
                      : 'date non renseignee'}
                  </p>
                  {selectedItem.existing_review ? (
                    <p className="mt-2 text-muted-foreground">
                      Un avis existe deja pour ce produit. Toute modification repassera en attente
                      de validation.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-2">
                <p className="text-sm font-medium">Note</p>
                <div className="flex flex-wrap gap-2">
                  {ratingValues.map((value) => (
                    <Button
                      key={value}
                      type="button"
                      variant={rating === value ? 'default' : 'outline'}
                      onClick={() => setRating(value)}
                      disabled={isPending}
                    >
                      {value}/5
                    </Button>
                  ))}
                </div>
              </div>

              <label className="space-y-2 text-sm">
                <span className="font-medium">Commentaire</span>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  className="flex min-h-[8rem] w-full rounded-[1.25rem] border border-input bg-background px-4 py-3 text-sm"
                  placeholder="Decrivez la qualite du produit, la fraicheur, la livraison ou l experience generale."
                />
              </label>

              <Button
                type="button"
                disabled={isPending || !selectedItem}
                onClick={() => {
                  if (!selectedItem) {
                    return
                  }

                  startTransition(async () => {
                    const result = await upsertCustomerReview({
                      orderItemId: selectedItem.order_item_id,
                      rating,
                      comment,
                    })

                    if (!result.success) {
                      toast({
                        title: 'Avis non enregistre',
                        description: result.error,
                        variant: 'destructive',
                      })
                      return
                    }

                    toast({
                      title: 'Avis enregistre',
                      description:
                        "Votre avis a ete enregistre et passera en validation avant publication.",
                    })
                    router.refresh()
                  })
                }}
              >
                {isPending ? 'Enregistrement...' : 'Enregistrer mon avis'}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun produit livre n est encore disponible pour un avis.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mes avis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-border/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{review.product_name ?? 'Produit'}</p>
                    <p className="text-sm text-muted-foreground">
                      {review.order_reference ? `${review.order_reference} - ` : ''}
                      Avis du {formatDateTime(review.created_at)}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">{review.rating}/5</p>
                    <p className="text-muted-foreground">
                      {review.is_published ? 'Publie' : 'En moderation'}
                    </p>
                  </div>
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
            <p className="text-sm text-muted-foreground">
              Aucun avis n a encore ete enregistre sur votre compte.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
