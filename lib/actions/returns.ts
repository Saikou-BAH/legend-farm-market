'use server'

export async function getCustomerReturns() {
  return {
    isConfigured: true,
    returns: [],
  }
}

export async function getAdminReturns() {
  return {
    access: {
      status: 'ready' as const,
      staff: null,
    },
    returns: [],
  }
}
