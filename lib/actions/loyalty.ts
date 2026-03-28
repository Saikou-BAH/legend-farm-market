'use server'

import { getCurrentCustomerAccount } from '@/lib/actions/shop'
import { getAdminShopSettings } from '@/lib/actions/admin-shop'
import { env } from '@/lib/env'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { LoyaltyTransaction } from '@/types'

function mapLoyaltyTransaction(row: any): LoyaltyTransaction {
  return {
    id: row.id,
    customer_id: row.customer_id,
    type: row.type,
    points: row.points ?? 0,
    balance_after: row.balance_after ?? 0,
    description: row.description,
    order_id: row.order_id,
    expires_at: row.expires_at,
    created_at: row.created_at,
  }
}

export async function getCustomerLoyaltySnapshot() {
  const { profile, ...rest } = await getCurrentCustomerAccount()

  if (!rest.isConfigured || !rest.isAuthenticated || !profile || !env.hasSupabase()) {
    return {
      ...rest,
      profile,
      transactions: [] as LoyaltyTransaction[],
    }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('loyalty_transactions')
    .select('*')
    .eq('customer_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(12)

  return {
    ...rest,
    profile,
    transactions: (data ?? []).map(mapLoyaltyTransaction),
  }
}

export async function getAdminLoyaltySettings() {
  const settingsState = await getAdminShopSettings()

  if (settingsState.access.status !== 'ready' || !env.hasServiceRole() || !env.hasSupabase()) {
    return {
      ...settingsState,
      recentTransactions: [] as LoyaltyTransaction[],
    }
  }

  const serviceClient = await createServiceClient()
  const { data } = await serviceClient
    .from('loyalty_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(15)

  return {
    ...settingsState,
    recentTransactions: (data ?? []).map(mapLoyaltyTransaction),
  }
}
