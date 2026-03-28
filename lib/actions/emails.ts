'use server'

import {
  getAdminEmailCampaignById,
  getAdminEmailCampaigns,
} from '@/lib/actions/admin-shop'

export async function getEmailCampaigns() {
  return getAdminEmailCampaigns()
}

export async function getEmailCampaignById(id: string) {
  return getAdminEmailCampaignById(id)
}
