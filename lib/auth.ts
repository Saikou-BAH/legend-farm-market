export type LegendFarmUserType = 'staff' | 'customer'

interface LegendFarmAuthPatch {
  userType?: LegendFarmUserType
  forcePasswordChange?: boolean
  tempPasswordSetAt?: string
  passwordChangedAt?: string
}

interface LegendFarmSection {
  user_type?: LegendFarmUserType
  force_password_change?: boolean
  temp_password_set_at?: string
  password_changed_at?: string
}

export interface LegendFarmAuthState {
  userType?: LegendFarmUserType
  forcePasswordChange: boolean
  tempPasswordSetAt?: string
  passwordChangedAt?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getLegendFarmSection(userMetadata: unknown): LegendFarmSection {
  if (!isRecord(userMetadata)) {
    return {}
  }

  const legendFarm = userMetadata.legend_farm

  if (!isRecord(legendFarm)) {
    return {}
  }

  const section: LegendFarmSection = {}

  if (legendFarm.user_type === 'staff' || legendFarm.user_type === 'customer') {
    section.user_type = legendFarm.user_type
  }

  if (typeof legendFarm.force_password_change === 'boolean') {
    section.force_password_change = legendFarm.force_password_change
  }

  if (typeof legendFarm.temp_password_set_at === 'string') {
    section.temp_password_set_at = legendFarm.temp_password_set_at
  }

  if (typeof legendFarm.password_changed_at === 'string') {
    section.password_changed_at = legendFarm.password_changed_at
  }

  return section
}

export function readLegendFarmAuthState(
  userLike: { user_metadata?: unknown } | null | undefined
): LegendFarmAuthState {
  const section = getLegendFarmSection(userLike?.user_metadata)

  return {
    userType: section.user_type,
    forcePasswordChange: section.force_password_change ?? false,
    tempPasswordSetAt: section.temp_password_set_at,
    passwordChangedAt: section.password_changed_at,
  }
}

export function mergeLegendFarmUserMetadata(
  existingMetadata: unknown,
  patch: LegendFarmAuthPatch
) {
  const currentMetadata = isRecord(existingMetadata) ? existingMetadata : {}
  const currentLegendFarm = getLegendFarmSection(currentMetadata)

  return {
    ...currentMetadata,
    legend_farm: {
      ...currentLegendFarm,
      ...(patch.userType !== undefined ? { user_type: patch.userType } : {}),
      ...(patch.forcePasswordChange !== undefined
        ? { force_password_change: patch.forcePasswordChange }
        : {}),
      ...(patch.tempPasswordSetAt !== undefined
        ? { temp_password_set_at: patch.tempPasswordSetAt }
        : {}),
      ...(patch.passwordChangedAt !== undefined
        ? { password_changed_at: patch.passwordChangedAt }
        : {}),
    },
  }
}

export function normalizeEmail(email: string) {
  const normalized = email.trim().toLowerCase()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error('Adresse email invalide.')
  }

  return normalized
}

export function normalizeFullName(fullName: string) {
  const normalized = fullName.trim()

  if (normalized.length < 2) {
    throw new Error('Le nom complet doit contenir au moins 2 caracteres.')
  }

  if (normalized.length > 120) {
    throw new Error('Le nom complet est trop long.')
  }

  return normalized
}

export function normalizePhone(phone: string | null | undefined) {
  if (phone === undefined || phone === null) {
    return null
  }

  const normalized = phone.trim()

  if (!normalized) {
    return null
  }

  if (normalized.length > 32) {
    throw new Error('Le telephone est trop long.')
  }

  return normalized
}

export function getPasswordValidationErrors(password: string) {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('au moins 8 caractères')
  }

  return errors
}

export function sanitizeInternalPath(
  value: string | null | undefined,
  fallback: string
) {
  if (!value) {
    return fallback
  }

  const normalized = value.trim()

  if (
    !normalized.startsWith('/') ||
    normalized.startsWith('//') ||
    normalized.startsWith('/api/')
  ) {
    return fallback
  }

  return normalized
}

export function getDefaultAuthenticatedPath(userType?: LegendFarmUserType) {
  return userType === 'staff' ? '/admin/dashboard' : '/account/dashboard'
}
