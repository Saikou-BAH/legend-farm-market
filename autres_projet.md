# Legend Farm — Résumé complet du projet

> Document de référence technique et fonctionnel.
> À transmettre à un LLM pour s'inspirer de l'architecture dans un nouveau projet.

---

## 1. Qu'est-ce que Legend Farm ?

Legend Farm est une **application web de gestion complète de ferme avicole**, développée pour suivre l'ensemble des opérations d'une exploitation : élevage des bandes de volailles, stock d'aliments et de médicaments, ventes, achats, finance, ressources humaines et rapports analytiques.

L'application est **mono-tenant** (une instance = une ferme), déployée sur Vercel, avec Supabase comme base de données et backend d'authentification.

---

## 2. Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 15 (App Router, Server Components, Server Actions) |
| Language | TypeScript strict |
| Base de données | Supabase (PostgreSQL) avec Row Level Security |
| Auth | Supabase Auth (email/password, magic link, reset) |
| UI | Tailwind CSS + shadcn/ui (Radix UI primitives) |
| Icônes | Lucide React |
| Formulaires | React Hook Form + Zod (validation) |
| Tableaux | TanStack Table v8 |
| Graphiques | Recharts |
| PDF | @react-pdf/renderer + Puppeteer Core (Chromium) |
| Export Excel | ExcelJS |
| Email | Nodemailer + Brevo SMTP |
| Monitoring | Sentry |
| Rate limiting | Upstash Redis (fallback mémoire en dev) |
| Déploiement | Vercel |

---

## 3. Architecture — patterns clés

### Server Actions (`lib/actions/`)
Toutes les mutations et lectures de données passent par des Server Actions Next.js (`'use server'`). Jamais d'API REST custom pour les données métier.

```typescript
// Pattern standard d'une action
'use server'
export async function createInvoice(input: InvoiceInput): Promise<ActionResult<Invoice>> {
  try { await requirePermission('invoices', 'create') } catch (e: unknown) {
    return { success: false, error: e instanceof Error ? e.message : 'Erreur' }
  }
  const supabase = await createClient()
  const parsed = invoiceSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }
  // ... logique métier
  revalidatePath('/invoices')
  return { success: true, data: result }
}
```

### Système de permissions à 3 niveaux
1. **Middleware** — vérifie la session, bloque les comptes inactifs/expirés
2. **guardPage()** — redirige vers `/access-denied` si pas de permission `view`
3. **requirePermission()** — bloque l'action serveur si pas autorisé
4. **RLS Supabase** — couche base de données (143 policies), dernier filet

```typescript
// Dans chaque page
await guardPage('invoices')

// Dans chaque action de mutation
await requirePermission('invoices', 'create') // ou 'edit', 'delete', 'view'
```

### Rôles et permissions granulaires
- 4 rôles de base : `admin`, `manager`, `accountant`, `employee`
- 31 ressources configurables (clients, invoices, stock, employees, etc.)
- Permissions par ressource : `can_view`, `can_create`, `can_edit`, `can_delete`
- Surcharge possible par utilisateur individuel via `user_permissions`
- Date d'expiration configurable par compte et par permission
- Interface admin complète pour gérer les permissions visuellement

### Notifications email (fire-and-forget)
```typescript
// Pattern : jamais bloquant, jamais propagé si erreur
import('@/lib/actions/notifications').then(({ sendMortalityAlert }) => {
  sendMortalityAlert({ ... }).catch(() => {})
})
```

---

## 4. Modules fonctionnels (75 pages, 49 actions)

### 4.1 Ventes
- **`/clients`** — Gestion des clients (create, edit, archive), soldes en temps réel, historique des factures, retours, règles de prix personnalisées par client
- **`/invoices`** — Facturation complète : création, validation, paiements partiels, avoirs, retours client, bons de livraison générés automatiquement, PDF imprimable, export CSV/Excel
- **`/delivery-notes`** — Bons de livraison avec PDF imprimable

### 4.2 Achats
- **`/suppliers`** — Gestion des fournisseurs, soldes, historique
- **`/purchases`** — Commandes fournisseurs, réception, paiements partiels, PDF

### 4.3 Élevage (cœur métier)
- **`/buildings`** — Bâtiments/poulaillers (capacité, statut)
- **`/bands`** — Bandes de volailles (création, suivi complet cycle de vie, fermeture, archivage). Chaque bande a : bâtiment, date de mise en place, quantité initiale, seuil d'alerte mortalité, programme vaccinal
- **`/daily-tracking`** — Suivi journalier par bande : œufs collectés (par grade), mortalité, consommation aliment/eau, poids. Calcul automatique du stock (mouvements FIFO)
- **`/vaccines`** — Programmes de vaccination, calendrier automatique, alertes retard
- **`/treatments`** — Traitements sanitaires par bande
- **`/vet-observations`** — Observations vétérinaires
- **`/mortality`** — Analyse de mortalité dédiée : taux par bande, graphiques, alertes seuil

### 4.4 Stock
- **`/stock`** — Produits avec catégories, seuils d'alerte, valorisation FIFO (CMUP), alertes stock bas par email
- **`/stock/movements`** — Historique complet des mouvements (entrée, sortie, ajustement)
- Consommation stock par bande (ventilation automatique depuis suivi journalier)

### 4.5 Finance
- **`/expenses`** — Dépenses avec catégories/sous-catégories, lien compte bancaire
- **`/revenues`** — Revenus non-facturés avec catégories
- **`/accounts`** — Comptes bancaires/caisse, transactions, virements entre comptes, soldes en temps réel
- **`/accounts/transfers`** — Virements inter-comptes
- **`/budget`** — Budget prévisionnel par période
- **`/pl`** — Compte de résultat mensuel (P&L) : revenus vs charges vs marge brute vs résultat net, comparaison mois précédent et N-1
- **`/aging`** — Créances clients (aging report) et dettes fournisseurs par buckets de 0-30 / 31-60 / 61-90 / +90 jours

### 4.6 Ressources Humaines
- **`/employees`** — Fichier employés, contrats, téléphone, avatar
- **`/contracts`** — Contrats de travail (type, salaire de base, dates)
- **`/payroll`** — Paiements de salaires avec ventilation automatique par bande, gestion des avances, fiche de paie PDF
- **`/employees/egg-consumption`** — Suivi de consommation d'œufs par les employés (avantage en nature)

### 4.7 Investisseurs
- **`/investors`** — Gestion des investisseurs, parts, valorisation, distributions
- **`/assets`** — Actifs physiques de la ferme (équipements, terrains, etc.)

### 4.8 Rapports analytiques
- **`/reports`** — Hub de rapports
- **`/reports/fcr`** — FCR (Feed Conversion Ratio) par semaine glissante : `kg_aliment / (œufs × 0.06)`, graphique avec seuils de référence
- **`/reports/benchmarking`** — Comparaison inter-bandes : taux de ponte, mortalité, FCR, coût/œuf, ROI
- **`/reports/cost-per-egg`** — Coût de revient réel par œuf : aliment + charges directes + masse salariale / nb œufs produits
- **`/reports/forecast`** — Prévision vs réalisé : taux de ponte hebdomadaire forecasted vs actual, graphique dual-line
- **`/reports/annual`** — Rapport annuel complet
- **`/reports/roi`** — ROI par bande
- **`/reports/alveoles`** — Suivi des alvéoles (emballages) prêtées aux clients
- **`/reports/internal-eggs`** — Œufs consommés en interne
- **`/reports/prix-minimum`** — Prix minimum de vente par grade d'œuf
- **`/reports/reform`** — Rapport de réforme (sorties de bandes)
- **`/reports/investor`** — Rapport investisseur avec PDF imprimable

### 4.9 Système
- **`/dashboard`** — KPIs temps réel : taux de ponte, mortalité, stock critique, factures impayées, activité récente
- **`/documents`** — Gestion documentaire (upload, lien aux entités, URL signée Supabase Storage)
- **`/calendar`** — Calendrier des tâches et vaccinations
- **`/tasks`** — Gestion de tâches (create, complete, delete)
- **`/equipment`** — Équipements (suivi, transferts entre bâtiments, statut)
- **`/settings`** — Paramètres ferme (nom, email pour alertes, seuil jours retard factures)
- **`/admin`** — Interface admin : gestion utilisateurs (invite, reset password, désactiver), permissions granulaires par ressource, rôles personnalisés
- **`/admin/audit-log`** — Journal d'audit complet de toutes les actions

---

## 5. Authentification & Sécurité

### Flux d'authentification
- Login via `/api/auth/login` avec rate limiting (10 tentatives/15min par email, 30/IP)
- Invitation par email → `/set-password` (premier mot de passe)
- Mot de passe oublié → `/forgot-password` → email → `/reset-password`
- Indicateur de force du mot de passe (8 car. min, maj, min, chiffre)
- Anti-énumération : messages d'erreur génériques

### Sécurité HTTP
- CSP complète (Content-Security-Policy)
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy

### Middleware
- Toutes routes protégées sauf : `/login`, `/forgot-password`, `/reset-password`, `/set-password`, `/auth/*`, `/api/auth/*`, `/api/cron/*`
- Vérification `is_active` et `access_expires_at` à chaque requête

---

## 6. Base de données — tables principales

```
farms                    — Ferme (nom, email alertes)
profiles                 — Utilisateurs (rôle, is_active, access_expires_at)
role_permissions         — Permissions par rôle + ressource
user_permissions         — Surcharges individuelles

buildings                — Bâtiments
bands                    — Bandes de volailles
daily_tracking           — Suivi journalier
daily_tracking_egg_grades — Détail par grade d'œuf
vaccine_schedules        — Planning vaccins
vaccine_events           — Événements vaccinaux
band_treatments          — Traitements
band_vet_observations    — Observations vétérinaires

customers                — Clients
invoices                 — Factures
invoice_items            — Lignes de facture
customer_payments        — Paiements reçus
credit_notes             — Avoirs
delivery_notes           — Bons de livraison

suppliers                — Fournisseurs
purchases                — Commandes fournisseurs
purchase_items           — Lignes d'achat
supplier_payments        — Paiements effectués

products                 — Produits stock
product_categories       — Catégories produits
stock_movements          — Mouvements de stock (FIFO avec batches)
stock_batches            — Lots FIFO pour valorisation CMUP

accounts                 — Comptes bancaires/caisse
account_transactions     — Transactions
account_transfers        — Virements inter-comptes
expenses                 — Dépenses directes
revenues                 — Revenus non-facturés
budget_lines             — Lignes budgétaires

employees                — Employés
employee_contracts       — Contrats
employee_payments        — Paiements de salaires
employee_advances        — Avances sur salaire
employee_cost_allocations — Ventilation charges par bande
employee_egg_consumption  — Conso. œufs employés

investors                — Investisseurs
investor_shares          — Parts
investor_contributions   — Apports
investor_distributions   — Distributions
physical_assets          — Actifs physiques

documents                — Documents uploadés
tasks                    — Tâches
audit_log                — Journal d'audit complet
alveole_loans            — Prêts d'alvéoles aux clients
```

---

## 7. Patterns réutilisables pour un site de vente

Ces patterns de Legend Farm sont directement applicables à un site e-commerce / vente :

### Gestion des clients
- Fiche client avec solde en temps réel (`getCustomerBalances()`)
- Historique des achats par client
- Règles de prix personnalisées par client (`client_price_rules`)
- Archivage (soft delete) au lieu de suppression définitive

### Facturation
- Statuts : `draft` → `validated` → `partially_paid` → `paid` → `cancelled`
- Paiements partiels avec reste à payer calculé automatiquement
- Génération PDF (via Puppeteer headless ou @react-pdf/renderer)
- Avoir (credit note) lié à la facture originale
- Export CSV et Excel

### Stock avec FIFO
- Entrées/sorties avec valorisation automatique FIFO
- Seuil d'alerte avec notification email fire-and-forget
- Historique complet des mouvements

### Finance
- Comptes multi-devises avec soldes temps réel
- Virements inter-comptes atomiques (via RPC Supabase)
- Catégories de dépenses/revenus arborescentes

### Permissions granulaires
- Système complet `can_view / can_create / can_edit / can_delete` par ressource
- Visible dans la sidebar (filtre selon les droits)
- Boutons d'action conditionnels (UI + serveur + RLS base de données)

### Notifications email
- Template HTML via Nodemailer + Brevo SMTP
- Récupération de l'email de destination depuis la table `farms` (ou équivalent `settings`)
- Pattern fire-and-forget : jamais bloquant pour l'utilisateur

### Exports
- CSV : Server Action retournant une string
- Excel : Route API `/api/exports?type=invoices` (nécessaire car binaire)
- PDF : Route API `/api/generate-pdf?type=invoice&id=xxx`

### Audit log
- Table `audit_log` avec `action`, `resource`, `resource_id`, `old_values`, `new_values`, `user_id`
- Triggers automatiques sur les tables critiques (via SQL)
- Interface de consultation avec filtres

---

## 8. Ce qui a été construit durant ce projet (chronologie)

### Phase 1 — Base sécurité & auth
- Système de permissions complet (RESOURCES, ROLE_DEFAULTS, guardPage, requirePermission)
- Flux forgot-password / reset-password
- Interface admin : gestion utilisateurs, permissions, rôles
- AlertDialog (remplacement window.confirm)
- Middleware avec vérification expiration + is_active

### Phase 2 — 9 nouvelles fonctionnalités
1. `/mortality` — Analyse mortalité dédiée avec graphiques Recharts
2. `/pl` — Compte de résultat mensuel (comparaison N-1)
3. `/aging` — Créances & dettes (aging report 4 buckets)
4. `/reports/fcr` — FCR par semaine glissante
5. `/reports/benchmarking` — Comparaison inter-bandes
6. `/reports/cost-per-egg` — Coût de revient réel par œuf
7. `/reports/forecast` — Prévision vs réalisé (dual-line chart)
8. Notifications email mortalité + stock bas (fire-and-forget)
9. 3 nouvelles ressources dans le système de permissions

### Phase 3 — Audit sécurité & qualité (10 sessions)
- 20 pages : boutons d'action conditionnés par `can_create/edit/delete`
- Suppression export GET sur route cron (POST uniquement)
- guardPage sur dashboard + toutes les pages investors/*
- requirePermission sur toutes les fonctions alveoles
- catch (e: unknown) partout (suppression des `catch (e: any)`)
- Vérification d'appartenance de document dans generate-pdf
- createClient au lieu de createServiceClient pour les lectures simples
- Promise.all sur les boucles du cron
- Validation UUID sur les paramètres de filtre
- CSP complète + tous les headers de sécurité HTTP
- Message d'erreur rate-limit unifié (anti-énumération comptes)
- Audit log : log console si enregistrement échoue
- Types explicites (suppression as any dans aging.ts, employees.ts, egg-grades.ts)

---

## 9. Variables d'environnement nécessaires

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_SITE_URL=

# Email (Brevo SMTP)
SMTP_USER=
SMTP_PASS=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=

# Cron (minimum 32 caractères — générer avec: openssl rand -hex 32)
CRON_SECRET=

# Rate limiting (optionnel — fallback mémoire en dev)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Monitoring (optionnel)
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=

# PDF (optionnel — pour Puppeteer en production)
CHROMIUM_PATH=
```

---

## 10. Script de gestion utilisateurs CLI

```bash
# Lister tous les utilisateurs
npx tsx scripts/manage-users.ts list

# Créer (invitation email — recommandé)
npx tsx scripts/manage-users.ts create --email=x@ferme.com --name="Prénom Nom" --role=manager

# Réinitialiser mot de passe
npx tsx scripts/manage-users.ts reset-password --email=x@ferme.com

# Modifier le rôle
npx tsx scripts/manage-users.ts update --email=x@ferme.com --role=accountant

# Désactiver
npx tsx scripts/manage-users.ts disable --email=x@ferme.com
```

---

## 11. Notes pour adapter en site de vente

Un site de vente e-commerce peut réutiliser directement :

- **L'intégralité du système auth + permissions** — même stack, même architecture
- **Le module Clients** (`/clients`) — presque identique à une base clients e-commerce
- **Le module Factures** (`/invoices`) — déjà complet avec PDF, paiements, avoirs
- **Le module Stock** (`/stock`) — valorisation FIFO prête à l'emploi
- **Le module Fournisseurs + Achats** — gestion des approvisionnements
- **Les exports CSV/Excel** — même pattern Route API
- **La génération PDF** — même stack Puppeteer/react-pdf
- **Les notifications email** — même pattern Nodemailer + Brevo
- **L'audit log** — même table, mêmes triggers SQL
- **Le système de permissions** — 0 changement nécessaire
- **Les composants UI** — shadcn/ui, entièrement réutilisables

Ce qu'il faudra ajouter pour un site de vente :
- Catalogue produits public (pages sans auth)
- Panier et session d'achat
- Intégration paiement en ligne (Stripe, PayDunya, etc.)
- Gestion des commandes en ligne (statuts spécifiques e-commerce)
- Espace client (suivi commandes)
- SEO et métadonnées publiques
