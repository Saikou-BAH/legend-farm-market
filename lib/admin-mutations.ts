'use server'

import { env } from '@/lib/env'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { StaffProfile, StaffRole } from '@/types'

interface AdminMutationReady {
  ok: true
  staff: StaffProfile
  supabase: Awaited<ReturnType<typeof createServiceClient>>
}

interface AdminMutationFailure {
  ok: false
  error: string
}

export type AdminMutationContext = AdminMutationReady | AdminMutationFailure

export async function recordAdminActivity(input: {
  supabase: Awaited<ReturnType<typeof createServiceClient>>
  staffId: string
  action: string
  entityType: string
  entityId?: string | null
  summary: string
  metadata?: Record<string, unknown> | null
}) {
  const { error } = await input.supabase.from('admin_activity_logs').insert({
    staff_id: input.staffId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    summary: input.summary,
    metadata: input.metadata ?? {},
  })

  if (error) {
    throw new Error(`Impossible d'enregistrer le journal admin: ${error.message}`)
  }
}

export async function requireAdminMutationContext(
  allowedRoles: StaffRole[]
): Promise<AdminMutationContext> {
  if (!env.hasSupabase()) {
    return {
      ok: false,
      error: "Supabase n'est pas encore configure.",
    }
  }

  if (!env.hasServiceRole()) {
    return {
      ok: false,
      error: 'La cle service role est requise pour executer cette action admin.',
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false,
      error: 'Vous devez etre connecte avec un compte staff.',
    }
  }

  const { data: staff } = await supabase
    .from('staff_profiles')
    .select('id, full_name, email, phone, role, is_active, created_at, updated_at')
    .eq('id', user.id)
    .maybeSingle()

  if (!staff || !staff.is_active) {
    return {
      ok: false,
      error: 'Votre compte staff ne permet pas cette action.',
    }
  }

  if (!allowedRoles.includes(staff.role)) {
    return {
      ok: false,
      error: `Le role ${staff.role} ne peut pas executer cette action.`,
    }
  }

  return {
    ok: true,
    staff,
    supabase: await createServiceClient(),
  }
}
