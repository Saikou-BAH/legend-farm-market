#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomInt } from 'node:crypto'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { createClient, type User } from '@supabase/supabase-js'

const STAFF_ROLES = ['admin', 'manager', 'support', 'logistics'] as const
const USER_SCOPES = ['staff', 'customers', 'all'] as const
const LONG_BAN_DURATION = '876000h'
const DELETE_CONFIRMATION_TOKEN = 'DELETE'

type StaffRole = (typeof STAFF_ROLES)[number]
type UserScope = (typeof USER_SCOPES)[number]
type LinkedUserType = 'staff' | 'customer' | 'ambiguous' | 'unlinked'
type ParsedArgs = Record<string, string | boolean>

type LegendFarmMetadata = {
  user_type?: 'staff' | 'customer'
  force_password_change?: boolean
  temp_password_set_at?: string
  password_changed_at?: string
}

interface StaffProfile {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: StaffRole
  is_active: boolean
  created_at: string
  updated_at: string
}

interface CustomerProfile {
  id: string
  full_name: string
  email: string
  phone: string | null
  customer_type: string
  loyalty_points: number
  loyalty_level: string
  credit_balance: number
  credit_limit: number
  is_blacklisted: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

interface ResolvedUser {
  authUser: User
  staffProfile: StaffProfile | null
  customerProfile: CustomerProfile | null
  linkedType: LinkedUserType
}

interface UserTarget {
  uid?: string
  email?: string
}

interface CreateStaffOptions {
  email: string
  fullName: string
  role: StaffRole
  phone: string | null
  tempPassword?: string
  active: boolean
}

interface UpdateOptions {
  scope?: UserScope
  fullName?: string
  phone?: string | null
  role?: StaffRole
  active?: boolean
}

interface ListRow {
  type: string
  email: string
  full_name: string
  role_or_segment: string
  profile_status: string
  auth_access: string
  created_at: string
  last_sign_in_at: string
}

function loadEnvFiles() {
  const envFiles = ['.env', '.env.local']

  for (const envFile of envFiles) {
    const absolutePath = join(process.cwd(), envFile)

    if (!existsSync(absolutePath)) {
      continue
    }

    const content = readFileSync(absolutePath, 'utf8')
    const lines = content.split(/\r?\n/)

    for (const rawLine of lines) {
      const line = rawLine.trim()

      if (!line || line.startsWith('#')) {
        continue
      }

      const separatorIndex = line.indexOf('=')

      if (separatorIndex === -1) {
        continue
      }

      const key = line.slice(0, separatorIndex).trim()

      if (!key || process.env[key] !== undefined) {
        continue
      }

      let value = line.slice(separatorIndex + 1).trim()

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      process.env[key] = value
    }
  }
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(
      `Variable d'environnement manquante: ${name}. Renseigne-la dans l'environnement shell ou dans .env.local.`
    )
  }

  return value
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000'
}

function createAdminClient() {
  return createClient(requireEnv('NEXT_PUBLIC_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

function parseArgs(argv: string[]) {
  const args: ParsedArgs = {}

  for (const arg of argv) {
    if (!arg.startsWith('--')) {
      throw new Error(
        `Argument invalide: ${arg}. Utilise uniquement la convention --key=value.`
      )
    }

    const withoutPrefix = arg.slice(2)
    const separatorIndex = withoutPrefix.indexOf('=')

    if (separatorIndex === -1) {
      args[withoutPrefix] = true
      continue
    }

    const key = withoutPrefix.slice(0, separatorIndex)
    const value = withoutPrefix.slice(separatorIndex + 1)
    args[key] = value
  }

  return args
}

function getStringArg(args: ParsedArgs, key: string) {
  const value = args[key]
  return typeof value === 'string' ? value : undefined
}

function getOptionalNonEmptyArg(args: ParsedArgs, key: string) {
  const value = getStringArg(args, key)

  if (value === undefined) {
    return undefined
  }

  return value.trim()
}

function getRequiredArg(args: ParsedArgs, key: string) {
  const value = getOptionalNonEmptyArg(args, key)

  if (!value) {
    throw new Error(`Option requise manquante: --${key}=...`)
  }

  return value
}

function parseBoolean(value: string, key: string) {
  const normalized = value.trim().toLowerCase()

  if (['true', '1', 'yes', 'oui', 'on'].includes(normalized)) {
    return true
  }

  if (['false', '0', 'no', 'non', 'off'].includes(normalized)) {
    return false
  }

  throw new Error(`Valeur booleenne invalide pour --${key}: ${value}`)
}

function getOptionalBooleanArg(args: ParsedArgs, key: string) {
  const raw = args[key]

  if (raw === undefined) {
    return undefined
  }

  if (typeof raw === 'boolean') {
    return raw
  }

  return parseBoolean(raw, key)
}

function normalizeScope(scope?: string): UserScope {
  if (!scope) {
    return 'all'
  }

  const normalized = scope.trim().toLowerCase()

  if (normalized === 'customer') {
    return 'customers'
  }

  if ((USER_SCOPES as readonly string[]).includes(normalized)) {
    return normalized as UserScope
  }

  throw new Error(
    `Scope invalide: ${scope}. Valeurs supportees: ${USER_SCOPES.join(', ')}.`
  )
}

function normalizeEmail(email: string) {
  const normalized = email.trim().toLowerCase()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error(`Email invalide: ${email}`)
  }

  return normalized
}

function normalizePhone(phone: string | undefined | null) {
  if (phone === undefined || phone === null) {
    return null
  }

  const normalized = phone.trim()

  if (!normalized) {
    return null
  }

  if (normalized.length > 32) {
    throw new Error('Le telephone est trop long. Reste sous 32 caracteres.')
  }

  return normalized
}

function normalizeFullName(fullName: string) {
  const normalized = fullName.trim()

  if (!normalized) {
    throw new Error('Le nom complet ne peut pas etre vide.')
  }

  if (normalized.length > 120) {
    throw new Error('Le nom complet est trop long. Reste sous 120 caracteres.')
  }

  return normalized
}

function normalizeStaffRole(role: string) {
  const normalized = role.trim().toLowerCase()

  if ((STAFF_ROLES as readonly string[]).includes(normalized)) {
    return normalized as StaffRole
  }

  throw new Error(
    `Role invalide: ${role}. Roles supportes: ${STAFF_ROLES.join(', ')}.`
  )
}

function validateTemporaryPassword(password: string) {
  if (password.length < 12) {
    throw new Error('Le mot de passe temporaire doit contenir au moins 12 caracteres.')
  }

  if (!/[a-z]/.test(password)) {
    throw new Error('Le mot de passe temporaire doit contenir au moins une minuscule.')
  }

  if (!/[A-Z]/.test(password)) {
    throw new Error('Le mot de passe temporaire doit contenir au moins une majuscule.')
  }

  if (!/[0-9]/.test(password)) {
    throw new Error('Le mot de passe temporaire doit contenir au moins un chiffre.')
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    throw new Error('Le mot de passe temporaire doit contenir au moins un caractere special.')
  }
}

function generateTemporaryPassword(length = 20) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const symbols = '!@#$%^*-_=+'
  const all = upper + lower + digits + symbols
  const passwordParts = [
    upper[randomInt(0, upper.length)],
    lower[randomInt(0, lower.length)],
    digits[randomInt(0, digits.length)],
    symbols[randomInt(0, symbols.length)],
  ]

  while (passwordParts.length < length) {
    passwordParts.push(all[randomInt(0, all.length)])
  }

  for (let index = passwordParts.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index + 1)
    const current = passwordParts[index]
    passwordParts[index] = passwordParts[swapIndex]
    passwordParts[swapIndex] = current
  }

  return passwordParts.join('')
}

function warnAboutPasswordArgument() {
  console.error(
    "Avertissement: passer un mot de passe via --temp-password peut laisser une trace dans l'historique shell. Preferer l'omission de l'option pour laisser le script generer un mot de passe temporaire."
  )
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return 'N/A'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toISOString()
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readLegendFarmMetadata(user: User): LegendFarmMetadata {
  if (!isPlainObject(user.user_metadata)) {
    return {}
  }

  const rawLegendFarm = user.user_metadata.legend_farm

  if (!isPlainObject(rawLegendFarm)) {
    return {}
  }

  const metadata: LegendFarmMetadata = {}

  if (rawLegendFarm.user_type === 'staff' || rawLegendFarm.user_type === 'customer') {
    metadata.user_type = rawLegendFarm.user_type
  }

  if (typeof rawLegendFarm.force_password_change === 'boolean') {
    metadata.force_password_change = rawLegendFarm.force_password_change
  }

  if (typeof rawLegendFarm.temp_password_set_at === 'string') {
    metadata.temp_password_set_at = rawLegendFarm.temp_password_set_at
  }

  if (typeof rawLegendFarm.password_changed_at === 'string') {
    metadata.password_changed_at = rawLegendFarm.password_changed_at
  }

  return metadata
}

function mergeLegendFarmMetadata(
  existingMetadata: unknown,
  patch: Partial<LegendFarmMetadata>
) {
  const currentMetadata = isPlainObject(existingMetadata) ? existingMetadata : {}
  const currentLegendFarm = isPlainObject(currentMetadata.legend_farm)
    ? currentMetadata.legend_farm
    : {}

  return {
    ...currentMetadata,
    legend_farm: {
      ...currentLegendFarm,
      ...patch,
    },
  }
}

function isAuthUserDisabled(user: User) {
  if (!user.banned_until) {
    return false
  }

  const bannedUntil = new Date(user.banned_until).getTime()

  if (Number.isNaN(bannedUntil)) {
    return true
  }

  return bannedUntil > Date.now()
}

function getTarget(args: ParsedArgs): UserTarget {
  const uid = getOptionalNonEmptyArg(args, 'uid')
  const email = getOptionalNonEmptyArg(args, 'email')

  if (!uid && !email) {
    throw new Error('Identifiant manquant. Utilise --uid=... ou --email=...')
  }

  if (uid && email) {
    throw new Error('Choisis soit --uid=..., soit --email=..., mais pas les deux.')
  }

  return {
    uid: uid || undefined,
    email: email ? normalizeEmail(email) : undefined,
  }
}

function requireOperationSuccess(error: { message?: string } | null, context: string) {
  if (error) {
    throw new Error(`${context}: ${error.message ?? 'Erreur inconnue.'}`)
  }
}

async function listAllAuthUsers(client: ReturnType<typeof createAdminClient>) {
  const users: User[] = []
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage })
    requireOperationSuccess(error, 'Impossible de lister les comptes Auth')

    users.push(...data.users)

    if (data.users.length < perPage) {
      break
    }

    page += 1
  }

  return users
}

async function findAuthUserByEmail(
  client: ReturnType<typeof createAdminClient>,
  email: string
) {
  const normalizedEmail = normalizeEmail(email)
  const users = await listAllAuthUsers(client)

  return (
    users.find((user) => (user.email ?? '').trim().toLowerCase() === normalizedEmail) ?? null
  )
}

async function getAuthUser(
  client: ReturnType<typeof createAdminClient>,
  target: UserTarget
) {
  if (target.uid) {
    const { data, error } = await client.auth.admin.getUserById(target.uid)
    requireOperationSuccess(error, `Impossible de recuperer l'utilisateur ${target.uid}`)

    if (!data.user) {
      throw new Error(`Aucun utilisateur Auth trouve pour l'UID ${target.uid}.`)
    }

    return data.user
  }

  const authUser = await findAuthUserByEmail(client, target.email ?? '')

  if (!authUser) {
    throw new Error(`Aucun utilisateur Auth trouve pour l'email ${target.email}.`)
  }

  return authUser
}

async function getStaffProfileById(
  client: ReturnType<typeof createAdminClient>,
  id: string
) {
  const { data, error } = await client
    .from('staff_profiles')
    .select('id, full_name, email, phone, role, is_active, created_at, updated_at')
    .eq('id', id)
    .maybeSingle()

  requireOperationSuccess(error, 'Impossible de lire staff_profiles')
  return (data as StaffProfile | null) ?? null
}

async function getCustomerProfileById(
  client: ReturnType<typeof createAdminClient>,
  id: string
) {
  const { data, error } = await client
    .from('customer_profiles')
    .select(
      'id, full_name, email, phone, customer_type, loyalty_points, loyalty_level, credit_balance, credit_limit, is_blacklisted, notes, created_at, updated_at'
    )
    .eq('id', id)
    .maybeSingle()

  requireOperationSuccess(error, 'Impossible de lire customer_profiles')
  return (data as CustomerProfile | null) ?? null
}

async function listStaffProfiles(client: ReturnType<typeof createAdminClient>) {
  const { data, error } = await client
    .from('staff_profiles')
    .select('id, full_name, email, phone, role, is_active, created_at, updated_at')
    .order('created_at', { ascending: false })

  requireOperationSuccess(error, 'Impossible de lister les profils staff')
  return (data as StaffProfile[] | null) ?? []
}

async function listCustomerProfiles(client: ReturnType<typeof createAdminClient>) {
  const { data, error } = await client
    .from('customer_profiles')
    .select(
      'id, full_name, email, phone, customer_type, loyalty_points, loyalty_level, credit_balance, credit_limit, is_blacklisted, notes, created_at, updated_at'
    )
    .order('created_at', { ascending: false })

  requireOperationSuccess(error, 'Impossible de lister les profils clients')
  return (data as CustomerProfile[] | null) ?? []
}

async function resolveUser(
  client: ReturnType<typeof createAdminClient>,
  target: UserTarget
): Promise<ResolvedUser> {
  const authUser = await getAuthUser(client, target)
  const [staffProfile, customerProfile] = await Promise.all([
    getStaffProfileById(client, authUser.id),
    getCustomerProfileById(client, authUser.id),
  ])

  let linkedType: LinkedUserType = 'unlinked'

  if (staffProfile && customerProfile) {
    linkedType = 'ambiguous'
  } else if (staffProfile) {
    linkedType = 'staff'
  } else if (customerProfile) {
    linkedType = 'customer'
  }

  return {
    authUser,
    staffProfile,
    customerProfile,
    linkedType,
  }
}

function getAuthAccessLabel(user: User | null) {
  if (!user) {
    return 'profil sans auth'
  }

  return isAuthUserDisabled(user) ? 'disabled' : 'enabled'
}

function getStaffProfileStatus(profile: StaffProfile) {
  return profile.is_active ? 'active' : 'inactive'
}

function getCustomerProfileStatus(profile: CustomerProfile) {
  return profile.is_blacklisted ? 'blacklisted' : 'standard'
}

async function buildListRows(
  client: ReturnType<typeof createAdminClient>,
  scope: UserScope
): Promise<ListRow[]> {
  const [authUsers, staffProfiles, customerProfiles] = await Promise.all([
    listAllAuthUsers(client),
    listStaffProfiles(client),
    listCustomerProfiles(client),
  ])

  const authUsersById = new Map(authUsers.map((user) => [user.id, user]))
  const staffById = new Map(staffProfiles.map((profile) => [profile.id, profile]))
  const customersById = new Map(customerProfiles.map((profile) => [profile.id, profile]))

  if (scope === 'staff') {
    return staffProfiles.map((profile) => {
      const authUser = authUsersById.get(profile.id) ?? null

      return {
        type: 'staff',
        email: profile.email,
        full_name: profile.full_name,
        role_or_segment: profile.role,
        profile_status: getStaffProfileStatus(profile),
        auth_access: getAuthAccessLabel(authUser),
        created_at: formatDateTime(profile.created_at),
        last_sign_in_at: formatDateTime(authUser?.last_sign_in_at),
      }
    })
  }

  if (scope === 'customers') {
    return customerProfiles.map((profile) => {
      const authUser = authUsersById.get(profile.id) ?? null

      return {
        type: 'customer',
        email: profile.email,
        full_name: profile.full_name,
        role_or_segment: profile.customer_type,
        profile_status: getCustomerProfileStatus(profile),
        auth_access: getAuthAccessLabel(authUser),
        created_at: formatDateTime(profile.created_at),
        last_sign_in_at: formatDateTime(authUser?.last_sign_in_at),
      }
    })
  }

  const rows: ListRow[] = []

  for (const user of authUsers) {
    const staffProfile = staffById.get(user.id) ?? null
    const customerProfile = customersById.get(user.id) ?? null

    if (staffProfile && customerProfile) {
      rows.push({
        type: 'ambiguous',
        email: user.email ?? staffProfile.email,
        full_name: staffProfile.full_name,
        role_or_segment: `${staffProfile.role} / ${customerProfile.customer_type}`,
        profile_status: `${getStaffProfileStatus(staffProfile)} / ${getCustomerProfileStatus(customerProfile)}`,
        auth_access: getAuthAccessLabel(user),
        created_at: formatDateTime(user.created_at),
        last_sign_in_at: formatDateTime(user.last_sign_in_at),
      })
      continue
    }

    if (staffProfile) {
      rows.push({
        type: 'staff',
        email: staffProfile.email,
        full_name: staffProfile.full_name,
        role_or_segment: staffProfile.role,
        profile_status: getStaffProfileStatus(staffProfile),
        auth_access: getAuthAccessLabel(user),
        created_at: formatDateTime(staffProfile.created_at),
        last_sign_in_at: formatDateTime(user.last_sign_in_at),
      })
      continue
    }

    if (customerProfile) {
      rows.push({
        type: 'customer',
        email: customerProfile.email,
        full_name: customerProfile.full_name,
        role_or_segment: customerProfile.customer_type,
        profile_status: getCustomerProfileStatus(customerProfile),
        auth_access: getAuthAccessLabel(user),
        created_at: formatDateTime(customerProfile.created_at),
        last_sign_in_at: formatDateTime(user.last_sign_in_at),
      })
      continue
    }

    rows.push({
      type: 'auth-only',
      email: user.email ?? 'N/A',
      full_name: 'N/A',
      role_or_segment: 'N/A',
      profile_status: 'no profile',
      auth_access: getAuthAccessLabel(user),
      created_at: formatDateTime(user.created_at),
      last_sign_in_at: formatDateTime(user.last_sign_in_at),
    })
  }

  return rows
}

function ensureScopeCompatible(resolvedUser: ResolvedUser, scope?: UserScope) {
  if (!scope || scope === 'all') {
    return
  }

  if (scope === 'staff' && resolvedUser.linkedType !== 'staff') {
    throw new Error('Le compte cible n est pas un membre du staff.')
  }

  if (scope === 'customers' && resolvedUser.linkedType !== 'customer') {
    throw new Error('Le compte cible n est pas un client.')
  }
}

async function setAuthAccess(
  client: ReturnType<typeof createAdminClient>,
  userId: string,
  enabled: boolean
) {
  const { error } = await client.auth.admin.updateUserById(userId, {
    ban_duration: enabled ? 'none' : LONG_BAN_DURATION,
  })

  requireOperationSuccess(
    error,
    enabled ? 'Impossible de reactiver le compte Auth' : 'Impossible de desactiver le compte Auth'
  )
}

async function createStaffUser(
  client: ReturnType<typeof createAdminClient>,
  options: CreateStaffOptions
) {
  const existingAuthUser = await findAuthUserByEmail(client, options.email)

  if (existingAuthUser) {
    throw new Error(`Un compte Auth existe deja pour ${options.email}.`)
  }

  const temporaryPassword = options.tempPassword ?? generateTemporaryPassword()
  validateTemporaryPassword(temporaryPassword)

  const now = new Date().toISOString()
  const { data, error } = await client.auth.admin.createUser({
    email: options.email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: mergeLegendFarmMetadata(undefined, {
      user_type: 'staff',
      force_password_change: true,
      temp_password_set_at: now,
    }),
  })

  requireOperationSuccess(error, 'Impossible de creer le compte Auth staff')

  if (!data.user) {
    throw new Error('Supabase a repondu sans objet user apres creation.')
  }

  const { error: profileError } = await client.from('staff_profiles').insert({
    id: data.user.id,
    full_name: options.fullName,
    email: options.email,
    phone: options.phone,
    role: options.role,
    is_active: options.active,
  })

  if (profileError) {
    const rollback = await client.auth.admin.deleteUser(data.user.id)

    if (rollback.error) {
      throw new Error(
        `Le profil staff n'a pas pu etre cree (${profileError.message}) et le rollback du compte Auth a egalement echoue (${rollback.error.message}).`
      )
    }

    throw new Error(`Le profil staff n'a pas pu etre cree: ${profileError.message}`)
  }

  if (!options.active) {
    await setAuthAccess(client, data.user.id, false)
  }

  return {
    user: data.user,
    temporaryPassword,
    generatedPassword: options.tempPassword === undefined,
  }
}

async function updateResolvedUser(
  client: ReturnType<typeof createAdminClient>,
  resolvedUser: ResolvedUser,
  options: UpdateOptions
) {
  ensureScopeCompatible(resolvedUser, options.scope)

  if (resolvedUser.linkedType === 'ambiguous' && !options.scope) {
    throw new Error(
      'Le compte possede a la fois un profil staff et un profil client. Precise --scope=staff ou --scope=customers.'
    )
  }

  if (resolvedUser.linkedType === 'unlinked') {
    throw new Error('Le compte Auth cible ne possede pas de profil applicatif a mettre a jour.')
  }

  if (resolvedUser.linkedType === 'staff' || options.scope === 'staff') {
    const staffProfile = resolvedUser.staffProfile

    if (!staffProfile) {
      throw new Error('Profil staff introuvable.')
    }

    const updates: Record<string, unknown> = {}

    if (options.fullName !== undefined) {
      updates.full_name = options.fullName
    }

    if (options.phone !== undefined) {
      updates.phone = options.phone
    }

    if (options.role !== undefined) {
      updates.role = options.role
    }

    if (options.active !== undefined) {
      updates.is_active = options.active
    }

    if (Object.keys(updates).length === 0) {
      throw new Error('Aucune modification staff a appliquer.')
    }

    const { error } = await client
      .from('staff_profiles')
      .update(updates)
      .eq('id', resolvedUser.authUser.id)

    requireOperationSuccess(error, 'Impossible de mettre a jour le profil staff')

    if (options.active !== undefined) {
      await setAuthAccess(client, resolvedUser.authUser.id, options.active)
    }

    return 'staff'
  }

  const customerProfile = resolvedUser.customerProfile

  if (!customerProfile) {
    throw new Error('Profil client introuvable.')
  }

  const updates: Record<string, unknown> = {}

  if (options.fullName !== undefined) {
    updates.full_name = options.fullName
  }

  if (options.phone !== undefined) {
    updates.phone = options.phone
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await client
      .from('customer_profiles')
      .update(updates)
      .eq('id', resolvedUser.authUser.id)

    requireOperationSuccess(error, 'Impossible de mettre a jour le profil client')
  }

  if (options.active !== undefined) {
    await setAuthAccess(client, resolvedUser.authUser.id, options.active)
  }

  if (Object.keys(updates).length === 0 && options.active === undefined) {
    throw new Error('Aucune modification client a appliquer.')
  }

  return 'customer'
}

async function setResolvedUserEnabled(
  client: ReturnType<typeof createAdminClient>,
  resolvedUser: ResolvedUser,
  enabled: boolean,
  scope?: UserScope
) {
  ensureScopeCompatible(resolvedUser, scope)

  if ((resolvedUser.linkedType === 'staff' || scope === 'staff') && resolvedUser.staffProfile) {
    const { error } = await client
      .from('staff_profiles')
      .update({ is_active: enabled })
      .eq('id', resolvedUser.authUser.id)

    requireOperationSuccess(
      error,
      enabled ? 'Impossible de reactiver le profil staff' : 'Impossible de desactiver le profil staff'
    )
  }

  await setAuthAccess(client, resolvedUser.authUser.id, enabled)
}

async function deleteResolvedUser(
  client: ReturnType<typeof createAdminClient>,
  resolvedUser: ResolvedUser
) {
  const { error } = await client.auth.admin.deleteUser(resolvedUser.authUser.id)
  requireOperationSuccess(error, 'Impossible de supprimer definitivement le compte')
}

async function setTemporaryPassword(
  client: ReturnType<typeof createAdminClient>,
  resolvedUser: ResolvedUser,
  tempPassword?: string
) {
  const password = tempPassword ?? generateTemporaryPassword()
  validateTemporaryPassword(password)

  const now = new Date().toISOString()
  const currentMetadata = readLegendFarmMetadata(resolvedUser.authUser)
  const nextUserType =
    resolvedUser.linkedType === 'staff' || resolvedUser.linkedType === 'customer'
      ? resolvedUser.linkedType
      : currentMetadata.user_type

  const mergedMetadata = mergeLegendFarmMetadata(resolvedUser.authUser.user_metadata, {
    user_type: nextUserType,
    force_password_change: true,
    temp_password_set_at: now,
  })

  const { error } = await client.auth.admin.updateUserById(resolvedUser.authUser.id, {
    password,
    user_metadata: mergedMetadata,
  })

  requireOperationSuccess(error, 'Impossible de definir le mot de passe temporaire')

  return password
}

async function generatePasswordResetLink(
  client: ReturnType<typeof createAdminClient>,
  resolvedUser: ResolvedUser,
  redirectTo?: string
) {
  const email = resolvedUser.authUser.email

  if (!email) {
    throw new Error('Ce compte ne possede pas d email, impossible de generer un lien de reinitialisation.')
  }

  const finalRedirectTo = redirectTo?.trim() || `${getAppUrl()}/reset-password`
  const { data, error } = await client.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: finalRedirectTo,
    },
  })

  requireOperationSuccess(error, 'Impossible de generer le lien de reinitialisation')

  if (!data.properties) {
    throw new Error('Supabase a repondu sans proprietes de lien de reinitialisation.')
  }

  return {
    email,
    actionLink: data.properties.action_link,
    redirectTo: data.properties.redirect_to,
  }
}

async function requestDeleteConfirmation(target: UserTarget) {
  const descriptor = target.email ?? target.uid ?? 'utilisateur inconnu'

  if (process.stdin.isTTY) {
    const rl = createInterface({ input, output })

    try {
      const answer = await rl.question(
        `Confirme la suppression definitive de ${descriptor} en tapant ${DELETE_CONFIRMATION_TOKEN}: `
      )

      if (answer.trim() !== DELETE_CONFIRMATION_TOKEN) {
        throw new Error('Confirmation incorrecte. Suppression annulee.')
      }
    } finally {
      rl.close()
    }

    return
  }

  throw new Error(
    `Action destructive refusee sans confirmation interactive. Relance avec un terminal interactif ou avec --confirm=${DELETE_CONFIRMATION_TOKEN}.`
  )
}

function printHelp() {
  console.log(`Legend Farm Market - Gestion securisee des utilisateurs

Usage:
  npm run users help
  npm run users list [--scope=staff|customers|all]
  npm run users create-staff --email=... --full-name=... --role=admin|manager|support|logistics [--phone=...] [--temp-password=...] [--active=true|false]
  npm run users update (--uid=...|--email=...) [--scope=staff|customers] [--full-name=...] [--phone=...] [--role=...] [--active=true|false]
  npm run users disable (--uid=...|--email=...) [--scope=staff|customers]
  npm run users enable (--uid=...|--email=...) [--scope=staff|customers]
  npm run users delete (--uid=...|--email=...) [--confirm=DELETE]
  npm run users info (--uid=...|--email=...) [--scope=staff|customers]
  npm run users set-temp-password (--uid=...|--email=...) [--temp-password=...]
  npm run users reset-password (--uid=...|--email=...) [--redirect-to=...]

Notes de securite:
  - Les mots de passe existants ne sont jamais affiches ni recuperes.
  - --temp-password est supporte, mais l'omettre est plus sur: le script genere alors un mot de passe temporaire affiche une seule fois.
  - Le reset password genere un lien Supabase; le script ne contourne pas la securite Auth et n'envoie pas l'email lui-meme.
  - Le script charge .env puis .env.local s'ils sont presents.`)
}

function printInfo(resolvedUser: ResolvedUser) {
  const metadata = readLegendFarmMetadata(resolvedUser.authUser)
  const info = {
    uid: resolvedUser.authUser.id,
    email: resolvedUser.authUser.email ?? 'N/A',
    type: resolvedUser.linkedType,
    auth_access: getAuthAccessLabel(resolvedUser.authUser),
    email_confirmed_at: formatDateTime(resolvedUser.authUser.email_confirmed_at),
    created_at: formatDateTime(resolvedUser.authUser.created_at),
    last_sign_in_at: formatDateTime(resolvedUser.authUser.last_sign_in_at),
    banned_until: formatDateTime(resolvedUser.authUser.banned_until),
    force_password_change: metadata.force_password_change ?? false,
    temp_password_set_at: formatDateTime(metadata.temp_password_set_at),
    password_changed_at: formatDateTime(metadata.password_changed_at),
  }

  console.log('Informations Auth')
  console.table([info])

  if (resolvedUser.staffProfile) {
    console.log('Profil staff')
    console.table([
      {
        id: resolvedUser.staffProfile.id,
        full_name: resolvedUser.staffProfile.full_name,
        email: resolvedUser.staffProfile.email,
        phone: resolvedUser.staffProfile.phone ?? 'N/A',
        role: resolvedUser.staffProfile.role,
        is_active: resolvedUser.staffProfile.is_active,
        created_at: formatDateTime(resolvedUser.staffProfile.created_at),
        updated_at: formatDateTime(resolvedUser.staffProfile.updated_at),
      },
    ])
  }

  if (resolvedUser.customerProfile) {
    console.log('Profil client')
    console.table([
      {
        id: resolvedUser.customerProfile.id,
        full_name: resolvedUser.customerProfile.full_name,
        email: resolvedUser.customerProfile.email,
        phone: resolvedUser.customerProfile.phone ?? 'N/A',
        customer_type: resolvedUser.customerProfile.customer_type,
        is_blacklisted: resolvedUser.customerProfile.is_blacklisted,
        loyalty_points: resolvedUser.customerProfile.loyalty_points,
        loyalty_level: resolvedUser.customerProfile.loyalty_level,
        created_at: formatDateTime(resolvedUser.customerProfile.created_at),
        updated_at: formatDateTime(resolvedUser.customerProfile.updated_at),
      },
    ])
  }

  if (!resolvedUser.staffProfile && !resolvedUser.customerProfile) {
    console.log('Aucun profil applicatif lie a cet utilisateur Auth.')
  }
}

async function main() {
  loadEnvFiles()

  const [, , rawCommand, ...argv] = process.argv
  const command = rawCommand?.trim().toLowerCase()

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp()
    return
  }

  const args = parseArgs(argv)
  const client = createAdminClient()

  switch (command) {
    case 'list': {
      const scope = normalizeScope(getOptionalNonEmptyArg(args, 'scope'))
      const rows = await buildListRows(client, scope)

      if (rows.length === 0) {
        console.log('Aucun utilisateur a afficher.')
        return
      }

      console.table(rows)
      return
    }

    case 'create-staff': {
      const tempPassword = getOptionalNonEmptyArg(args, 'temp-password')

      if (tempPassword) {
        warnAboutPasswordArgument()
        validateTemporaryPassword(tempPassword)
      }

      const result = await createStaffUser(client, {
        email: normalizeEmail(getRequiredArg(args, 'email')),
        fullName: normalizeFullName(getRequiredArg(args, 'full-name')),
        role: normalizeStaffRole(getRequiredArg(args, 'role')),
        phone: normalizePhone(getOptionalNonEmptyArg(args, 'phone')),
        tempPassword: tempPassword || undefined,
        active: getOptionalBooleanArg(args, 'active') ?? true,
      })

      console.log('Compte staff cree avec succes.')
      console.table([
        {
          uid: result.user.id,
          email: result.user.email ?? 'N/A',
          generated_password: result.generatedPassword,
          force_password_change_flag: true,
          created_at: formatDateTime(result.user.created_at),
        },
      ])
      console.log('Mot de passe temporaire (affiche une seule fois):')
      console.log(result.temporaryPassword)
      console.log(
        'Action requise: communique ce mot de passe via un canal securise et demande a l utilisateur de le remplacer des sa premiere connexion.'
      )
      console.log(
        'Important: le script pose bien un indicateur force_password_change dans les metadata Supabase, mais le front actuel du projet ne l applique pas encore automatiquement.'
      )
      return
    }

    case 'update': {
      const target = getTarget(args)
      const scope = normalizeScope(getOptionalNonEmptyArg(args, 'scope'))
      const resolvedUser = await resolveUser(client, target)
      const roleArg = getOptionalNonEmptyArg(args, 'role')
      const updatedType = await updateResolvedUser(client, resolvedUser, {
        scope,
        fullName:
          getOptionalNonEmptyArg(args, 'full-name') !== undefined
            ? normalizeFullName(getRequiredArg(args, 'full-name'))
            : undefined,
        phone:
          args.phone !== undefined
            ? normalizePhone(getOptionalNonEmptyArg(args, 'phone'))
            : undefined,
        role: roleArg !== undefined ? normalizeStaffRole(roleArg) : undefined,
        active: getOptionalBooleanArg(args, 'active'),
      })

      console.log(`Profil ${updatedType} mis a jour avec succes.`)
      return
    }

    case 'disable': {
      const target = getTarget(args)
      const scope = normalizeScope(getOptionalNonEmptyArg(args, 'scope'))
      const resolvedUser = await resolveUser(client, target)
      await setResolvedUserEnabled(client, resolvedUser, false, scope)
      console.log('Compte desactive avec succes.')
      return
    }

    case 'enable': {
      const target = getTarget(args)
      const scope = normalizeScope(getOptionalNonEmptyArg(args, 'scope'))
      const resolvedUser = await resolveUser(client, target)
      await setResolvedUserEnabled(client, resolvedUser, true, scope)
      console.log('Compte reactive avec succes.')
      return
    }

    case 'delete': {
      const target = getTarget(args)
      const confirmValue = getOptionalNonEmptyArg(args, 'confirm')

      if (confirmValue !== DELETE_CONFIRMATION_TOKEN) {
        await requestDeleteConfirmation(target)
      }

      const resolvedUser = await resolveUser(client, target)
      await deleteResolvedUser(client, resolvedUser)
      console.log('Compte supprime definitivement.')
      return
    }

    case 'info': {
      const target = getTarget(args)
      const scope = normalizeScope(getOptionalNonEmptyArg(args, 'scope'))
      const resolvedUser = await resolveUser(client, target)
      ensureScopeCompatible(resolvedUser, scope)
      printInfo(resolvedUser)
      return
    }

    case 'set-temp-password': {
      const target = getTarget(args)
      const tempPassword = getOptionalNonEmptyArg(args, 'temp-password')

      if (tempPassword) {
        warnAboutPasswordArgument()
        validateTemporaryPassword(tempPassword)
      }

      const resolvedUser = await resolveUser(client, target)
      const password = await setTemporaryPassword(client, resolvedUser, tempPassword || undefined)

      console.log('Mot de passe temporaire defini avec succes.')
      console.log('Mot de passe temporaire (affiche une seule fois):')
      console.log(password)
      console.log(
        'Important: le mot de passe precedent n est jamais lu ni affiche. Le script ecrit uniquement un nouveau secret temporaire.'
      )
      console.log(
        'Important: le script pose bien un indicateur force_password_change dans les metadata Supabase, mais le front actuel du projet ne l applique pas encore automatiquement.'
      )
      return
    }

    case 'reset-password': {
      const target = getTarget(args)
      const resolvedUser = await resolveUser(client, target)
      const result = await generatePasswordResetLink(
        client,
        resolvedUser,
        getOptionalNonEmptyArg(args, 'redirect-to') || undefined
      )

      console.log('Lien de reinitialisation genere avec succes.')
      console.table([
        {
          email: result.email,
          redirect_to: result.redirectTo,
        },
      ])
      console.log('Lien de reinitialisation (affiche une seule fois):')
      console.log(result.actionLink)
      console.log(
        'Important: le script ne contourne pas Supabase Auth et n envoie pas lui-meme ce lien par email. Partage-le uniquement via un canal securise.'
      )
      console.log(
        'Limite actuelle: le projet n a pas encore de parcours frontend complet de reinitialisation de mot de passe confirme par le code. Si besoin immediat, prefere set-temp-password.'
      )
      return
    }

    default:
      throw new Error(`Commande inconnue: ${command}. Lance \"npm run users help\".`)
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Erreur inconnue.'
  console.error(`Erreur: ${message}`)
  process.exit(1)
})
