'use client'

import { useRef, useState, useTransition } from 'react'
import { ChevronLeft, ChevronRight, ImagePlus, Star, Trash2 } from 'lucide-react'
import {
  moveAdminProductImage,
  removeAdminProductImage,
  setAdminPrimaryProductImage,
  uploadAdminProductImage,
} from '@/lib/actions/admin-product-media'
import { ProductVisual } from '@/components/shop/product-visual'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface ProductMediaManagerProps {
  productId: string
  productName: string
  images: string[]
}

export function ProductMediaManager({
  productId,
  productName,
  images,
}: ProductMediaManagerProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)

  const runAction = (
    action: () => Promise<{ success: boolean; error?: string }>,
    successTitle: string
  ) => {
    startTransition(async () => {
      const result = await action()

      if (!result.success) {
        toast({
          title: 'Action impossible',
          description: result.error ?? "Une erreur s'est produite.",
          variant: 'destructive',
        })
        return
      }

      toast({
        title: successTitle,
        description: 'Les medias du produit ont ete mis a jour.',
      })
      router.refresh()
    })
  }

  const handleUpload = () => {
    const form = formRef.current

    if (!form) {
      return
    }

    const formData = new FormData(form)

    runAction(
      async () => uploadAdminProductImage(productId, formData),
      'Image ajoutee'
    )

    form.reset()
    setSelectedFileName(null)
  }

  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle>Medias produit</CardTitle>
        <CardDescription>
          Ajoutez, supprimez et reordonnez les images visibles sur la boutique. La premiere image reste l image principale du produit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <form
          ref={formRef}
          className="grid gap-4 rounded-[1.5rem] border border-border/70 bg-muted/25 p-5 md:grid-cols-[1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault()
            handleUpload()
          }}
        >
          <div className="space-y-3">
            <Label htmlFor="product-image-upload">Ajouter une image</Label>
            <Input
              id="product-image-upload"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={(event) => {
                setSelectedFileName(event.target.files?.[0]?.name ?? null)
              }}
            />
            <p className="text-sm text-muted-foreground">
              Formats acceptes: JPG, PNG, WebP, AVIF. Taille maximale: 8 Mo.
              {selectedFileName ? ` Fichier selectionne: ${selectedFileName}.` : ''}
            </p>
          </div>

          <div className="flex items-end">
            <Button type="submit" className="w-full md:w-auto" disabled={isPending}>
              <ImagePlus className="h-4 w-4" />
              {isPending ? 'Envoi...' : 'Envoyer l image'}
            </Button>
          </div>
        </form>

        {images.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {images.map((image, index) => {
              const isPrimary = index === 0
              const canMoveLeft = index > 0
              const canMoveRight = index < images.length - 1

              return (
                <Card key={image} className="overflow-hidden border-border/70">
                  <ProductVisual
                    name={`${productName} - media ${index + 1}`}
                    imageUrl={image}
                    className="h-52"
                  />
                  <CardContent className="space-y-4 p-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {isPrimary ? 'Image principale' : `Image ${index + 1}`}
                      </p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{image}</p>
                    </div>

                    <div className="grid gap-2">
                      <Button
                        type="button"
                        variant={isPrimary ? 'secondary' : 'outline'}
                        size="sm"
                        disabled={isPending || isPrimary}
                        onClick={() =>
                          runAction(
                            async () => setAdminPrimaryProductImage(productId, image),
                            'Image principale mise a jour'
                          )
                        }
                      >
                        <Star className="h-4 w-4" />
                        {isPrimary ? 'Image principale active' : 'Definir en principale'}
                      </Button>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isPending || !canMoveLeft}
                          onClick={() =>
                            runAction(
                              async () => moveAdminProductImage(productId, image, 'left'),
                              'Ordre des images mis a jour'
                            )
                          }
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Monter
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isPending || !canMoveRight}
                          onClick={() =>
                            runAction(
                              async () => moveAdminProductImage(productId, image, 'right'),
                              'Ordre des images mis a jour'
                            )
                          }
                        >
                          Descendre
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={() => {
                          const confirmed = window.confirm(
                            "Supprimer cette image du produit ?"
                          )

                          if (!confirmed) {
                            return
                          }

                          runAction(
                            async () => removeAdminProductImage(productId, image),
                            'Image supprimee'
                          )
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Aucune image n est encore associee a ce produit. La premiere image envoyee deviendra automatiquement l image principale visible sur la boutique.
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
