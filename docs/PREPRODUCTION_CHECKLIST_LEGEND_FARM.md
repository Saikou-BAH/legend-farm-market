# Checklist de pre-production - Legend Farm Shop

## 1. Variables d environnement

- `NEXT_PUBLIC_APP_URL` pointe vers l URL finale Vercel
- `NEXT_PUBLIC_SUPABASE_URL` est renseignee
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` est renseignee
- `SUPABASE_SERVICE_ROLE_KEY` est renseignee
- `SENTRY_DSN` est renseignee
- `NEXT_PUBLIC_SENTRY_DSN` est renseignee
- `SENTRY_ORG` est renseignee
- `SENTRY_PROJECT` est renseignee
- `SENTRY_AUTH_TOKEN` est renseignee pour les builds relies a Sentry
- `RESEND_API_KEY` est renseignee si les emails doivent partir en production
- `RESEND_FROM_EMAIL` est renseignee si les emails doivent partir en production
- `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` sont renseignees si un rate limit distribue est retenu

## 2. Migrations Supabase a appliquer

- `001_shop_foundation.sql`
- `002_staff_profiles_phone.sql`
- `003_product_media_storage.sql`
- `004_payment_transactions.sql`
- `005_admin_activity_logs.sql`
- `006_loyalty_checkout_settings.sql`

## 3. Donnees minimales a verifier

- au moins un compte `staff_profiles` actif existe
- des `products` publics et disponibles existent
- les `shop_settings` principaux sont renseignes
  - `shop_name`
  - `shop_email`
  - `shop_phone`
  - `shop_address`
  - `welcome_points`
  - `min_order_amount`
- au moins une `delivery_zone` active existe si la livraison est proposee

## 4. Verification front client

- la home charge sans erreur
- le catalogue charge et filtre correctement
- les fiches produit affichent prix, disponibilite et media
- l ajout au panier fonctionne
- le panier persiste au rechargement
- le checkout fonctionne avec un client authentifie
- une commande reelle est creee
- la page de confirmation et la page de suivi lisent la vraie commande
- la page contact accepte un message valide
- les liens WhatsApp et telephone sont corrects

## 5. Verification espace client

- login, register, forgot-password, reset-password et logout fonctionnent
- le profil client est editable
- les adresses sont gerables
- l historique de commandes charge
- le detail de commande affiche lignes et paiements
- les retours client peuvent etre crees
- les avis clients peuvent etre envoyes
- l historique de fidelite charge

## 6. Verification back-office

- le dashboard admin charge
- la creation produit fonctionne
- l edition produit fonctionne
- l upload image produit fonctionne
- la mise a jour commande fonctionne
- l enregistrement d un paiement fonctionne
- la gestion client fonctionne
- la gestion promotion fonctionne
- la gestion campagne email fonctionne
- la gestion parametres boutique fonctionne
- le journal admin recent remonte des operations
- la moderation des avis fonctionne
- le detail des retours affiche les lignes concernees
- les analytics et exports CSV chargent sans erreur

## 7. Verification communication client

- l email de bienvenue part si Resend est configure
- l email de confirmation commande part si Resend est configure
- l email de statut commande part si Resend est configure
- l email de reset password part via Supabase Auth
- les notifications de retour en stock partent si Resend est configure
- le formulaire de contact route bien vers l email de la boutique

## 8. Verification technique

- `npm run test:smoke` passe
- `npm run verify:readiness` passe
- `npm run build` passe
- `robots.txt` et `sitemap.xml` sont exposes
- le deploiement Vercel utilise les bonnes variables de production
- les scripts `npm run users` et `npm run verify:readiness` restent operationnels

## 9. Risques a lever avant mise en ligne

- provider email non configure
- bucket Storage non cree cote Supabase distant
- migrations non appliquees
- absence de compte staff actif
- rate limit distribue non configure si Upstash est voulu

## 10. Decision de lancement

Le site est pret pour un lancement pilote si :

- les migrations sont appliquees
- les variables critiques sont presentes
- au moins un admin actif peut piloter produits et commandes
- le parcours client complet a ete rejoue une fois en environnement de pre-production
- les emails requis pour le lancement sont configures ou explicitement reportes
