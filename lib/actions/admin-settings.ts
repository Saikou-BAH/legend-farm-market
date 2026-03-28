'use server'

import { revalidatePath } from 'next/cache'
import {
  recordAdminActivity,
  requireAdminMutationContext,
} from '@/lib/admin-mutations'
import type { ActionResult } from '@/types'

const settingsRoles = ['admin', 'manager'] as const

export async function updateAdminShopSettings(
  entries: Array<{ key: string; value: string }>
): Promise<ActionResult<{ updated: number }>> {
  try {
    const context = await requireAdminMutationContext([...settingsRoles])

    if (!context.ok) {
      return {
        success: false,
        error: context.error,
      }
    }

    const sanitizedEntries = entries
      .map((entry) => ({
        key: entry.key.trim(),
        value: entry.value.trim(),
      }))
      .filter((entry) => entry.key)

    if (sanitizedEntries.length === 0) {
      return {
        success: false,
        error: 'Aucun parametre valide a enregistrer.',
      }
    }

    for (const entry of sanitizedEntries) {
      const { error } = await context.supabase
        .from('shop_settings')
        .update({ value: entry.value })
        .eq('key', entry.key)

      if (error) {
        throw new Error(
          `Impossible de mettre a jour le parametre ${entry.key}: ${error.message}`
        )
      }
    }

    await recordAdminActivity({
      supabase: context.supabase,
      staffId: context.staff.id,
      action: 'settings.updated',
      entityType: 'shop_settings',
      summary: `${sanitizedEntries.length} parametre(s) boutique mis a jour`,
      metadata: {
        keys: sanitizedEntries.map((entry) => entry.key),
      },
    })

    revalidatePath('/')
    revalidatePath('/products')
    revalidatePath('/checkout')
    revalidatePath('/admin/settings')
    revalidatePath('/account/dashboard')

    return {
      success: true,
      data: {
        updated: sanitizedEntries.length,
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Impossible de mettre a jour les parametres boutique.',
    }
  }
}
