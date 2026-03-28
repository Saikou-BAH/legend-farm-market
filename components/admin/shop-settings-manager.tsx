'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateAdminShopSettings } from '@/lib/actions/admin-settings'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import type { ShopSetting } from '@/types'

interface ShopSettingsManagerProps {
  settings: ShopSetting[]
}

function createSettingsState(settings: ShopSetting[]) {
  return Object.fromEntries(settings.map((setting) => [setting.key, setting.value]))
}

export function ShopSettingsManager({ settings }: ShopSettingsManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [values, setValues] = useState<Record<string, string>>(
    createSettingsState(settings)
  )

  useEffect(() => {
    setValues(createSettingsState(settings))
  }, [settings])

  const isDirty = useMemo(() => {
    return settings.some((setting) => values[setting.key] !== setting.value)
  }, [settings, values])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    startTransition(async () => {
      const result = await updateAdminShopSettings(
        settings.map((setting) => ({
          key: setting.key,
          value: values[setting.key] ?? '',
        }))
      )

      if (!result.success) {
        toast({
          title: 'Parametres non mis a jour',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Parametres mis a jour',
        description: `${result.data.updated} parametre(s) ont ete enregistres.`,
      })
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parametres boutique</CardTitle>
        <CardDescription>
          Ajustez ici les valeurs qui pilotent le nom, le contact, la livraison
          et les regles globales du shop.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {settings.length > 0 ? (
            settings.map((setting) => (
              <div
                key={setting.id}
                className="rounded-[1.25rem] border border-border/70 p-4"
              >
                <div className="grid gap-2">
                  <Label htmlFor={`setting-${setting.key}`}>{setting.key}</Label>
                  <Input
                    id={`setting-${setting.key}`}
                    value={values[setting.key] ?? ''}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [setting.key]: event.target.value,
                      }))
                    }
                  />
                  {setting.description ? (
                    <p className="text-sm text-muted-foreground">
                      {setting.description}
                    </p>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Aucun parametre charge depuis la base.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isPending || !isDirty}>
              {isPending ? 'Enregistrement...' : 'Enregistrer les parametres'}
            </Button>
            {!isDirty ? (
              <span className="text-sm text-muted-foreground">
                Aucun changement detecte.
              </span>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
