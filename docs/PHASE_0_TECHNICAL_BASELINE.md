# Phase 0 - Baseline technique

Etat de reference etabli a partir du code du projet `legend-farm-market` au 2026-03-28.

## 1. Objectif du document

Ce document sert de base de verification pour la Phase 0 de la roadmap.

Il se limite a des constats confirmes par le code local :

- ce qui est deja branche
- ce qui est partiellement branche
- ce qui est encore placeholder
- quelles tables sont reellement utilisees
- quels helpers existent deja mais ne sont pas encore branches

## 2. Routes par niveau de maturite

### 2.1 Routes deja branchees sur de vraies lectures

Routes confirmees par le code comme alimentees par Supabase ou par des flows reels :

- `/`
- `/products`
- `/products/[id]`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/account/dashboard`
- `/account/orders`
- `/account/orders/[id]`
- `/account/addresses`
- `/account/loyalty`
- `/account/profile`
- `/admin/dashboard`
- `/admin/orders`
- `/admin/orders/[id]`
- `/admin/products`
- `/admin/products/[id]`
- `/admin/customers`
- `/admin/customers/[id]`
- `/admin/promotions`
- `/admin/deliveries`
- `/admin/loyalty`
- `/admin/settings`

### 2.2 Routes partiellement branchees

Routes avec structure utile mais flux metier encore incomplet :

- `/cart`
- `/checkout`
- `/order-confirmation/[id]`
- `/track/[id]`

Constat confirme :

- la structure UI existe
- le flux transactionnel reel n existe pas encore
- certaines donnees restent statiques ou purement descriptives

### 2.3 Routes placeholder assumees

Routes encore explicitement placeholders dans le code :

- `/account/returns`
- `/account/reviews`
- `/admin/analytics`
- `/admin/emails`
- `/admin/emails/[id]`
- `/admin/returns`
- `/admin/returns/[id]`
- `/admin/promotions/[id]`

## 3. Tables reellement branchees dans l application

Tables confirmees par les requetes `from(...)` presentes dans `app/` et `lib/` :

- `products`
- `orders`
- `order_items`
- `customer_profiles`
- `customer_addresses`
- `delivery_zones`
- `promotions`
- `shop_settings`
- `staff_profiles`

## 4. Tables presentes dans le schema mais pas encore branchees

Tables definies dans la migration locale mais non reliees a un flux applicatif actif a ce stade :

- `delivery_persons`
- `returns`
- `return_items`
- `promo_usages`
- `loyalty_transactions`
- `product_reviews`
- `email_campaigns`
- `stock_notifications`
- `abandoned_carts`
- `shop_reference_sequences`

## 5. Helpers et modules utilitaires

### 5.1 Helpers deja utilises activement

- `lib/auth.ts`
- `lib/rate-limit.ts`
- `lib/utils.ts`
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`

### 5.2 Helpers presents mais pas encore branches au parcours principal

Helpers metier confirmes dans le depot mais pas encore relies a un flux utilisateur ou admin actif :

- `lib/utils/price.ts`
- `lib/utils/points.ts`
- `lib/utils/promo.ts`

Decision Phase 0 :

- conserver ces helpers
- ne pas les supprimer
- les brancher dans les phases panier, checkout, promotions et fidelite

### 5.3 Templates emails presents mais non envoyes

Templates confirmes mais sans provider d envoi branche a ce stade :

- `lib/emails/welcome.tsx`
- `lib/emails/order-confirmation.tsx`
- `lib/emails/order-status.tsx`
- `lib/emails/abandoned-cart.tsx`
- `lib/emails/promotion.tsx`

## 6. Variables d environnement utiles confirmees

Variables confirmees par le code actuel :

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `ANALYZE`

## 7. Corrections Phase 0 deja effectuees

Corrections confirmees dans le code :

- detail commande client charge par requete directe `id`
- detail commande admin charge par requete directe `id`
- detail client admin charge par requete directe `id`
- detail produit admin charge par requete directe `id`, y compris si le produit est indisponible
- enrichissement des types utiles pour `Product`, `Order`, `OrderItem`, `OrderDetail` et `AdminOrderDetail`
- `.env.example` complete avec Upstash

## 8. Verifications Phase 0 deja passees

Verifications effectuees apres implementation :

- plus de recherche locale fragile `find(...id...)` sur les details de commandes / produits / clients concernes
- `npm run build` passe

## 9. Ce qu il reste a finir dans la Phase 0

Bloc encore ouvert dans la roadmap :

- continuer la clarification des placeholders restants
- garder cette baseline a jour quand une route passe de placeholder a partielle puis a fonctionnelle
- poursuivre l alignement strict entre types utiles et colonnes reellement manipulees
