# Legend Farm Shop - Cadrage du projet

Ce fichier centralise les consignes donnees par le client afin de garder une reference stable pendant toute la construction du projet.

## Identite du projet

- Nom du projet : `Legend Farm Shop`
- Emplacement obligatoire : `/home/saikou/legend-farm-market`
- Nature du projet : nouvelle boutique en ligne de la ferme `Legend Farm`
- Stack cible : `Next.js`, `TypeScript`, `Tailwind CSS`, `shadcn/ui`, `Supabase`
- Cible de deploiement : `Vercel`

## Regles de travail

- Le projet doit etre cree directement dans `/home/saikou/legend-farm-market`
- Il ne faut pas repartir dans un dossier temporaire pour le livrable final
- Il faut conserver les memes outils et les memes grands patterns que `legend-farm`
- Si des choses sont mal faites dans le projet source, il ne faut pas les recopier telles quelles
- Il faut preferer une version plus propre, plus solide et plus maintenable
- Il faut maintenir un journal d'avancement dans `IMPLEMENTATION_LOG.md`
- Il faut conserver ce fichier de cadrage pour s'y referer plus tard
- Les prix, frais, promotions et autres donnees metier ne doivent pas etre codes en dur dans l interface
- Les valeurs metier doivent venir de Supabase et etre administrables depuis le site avec un compte admin
- Tous les montants affiches sur le site doivent etre presentes en `GNF`
- Le projet doit rester compatible avec un deploiement `Vercel` des le depart
- Les variables d environnement critiques doivent etre pensees pour etre renseignees aussi dans `Vercel`

## Analyse du projet source

Avant de coder, le projet source `/home/saikou/legend-farm` devait etre analyse pour comprendre :

- la stack technique exacte
- l'architecture du projet
- l'organisation des server actions
- la configuration Supabase
- le middleware d'authentification
- les types TypeScript
- les migrations Supabase
- les conventions de code
- les composants UI installes
- les patterns recurrents

## Direction technique retenue

- Reprendre la stack de `legend-farm`
- Garder l'organisation generale en `app/`, `components/`, `lib/`, `types/`, `supabase/`
- Conserver l'approche `Supabase SSR`
- Conserver l'usage de `server actions` centralisees dans `lib/actions`
- Conserver les primitives UI et les patterns Tailwind/shadcn
- Mieux figer les versions pour eviter la derive entre `package.json` et `package-lock`

## Exigences fonctionnelles principales

Le projet doit couvrir :

- une vitrine / landing page
- une boutique publique
- un panier
- un checkout
- un espace client
- une liste de commandes client
- un back-office shop

## Structure de pages demandee

Le projet doit maintenant s'aligner sur ces grands blocs :

- `app/(shop)` pour les pages publiques
- `app/(auth)` pour l'authentification client
- `app/(account)` pour l'espace client connecte
- `app/(admin)` pour le back-office

Les ecrans attendus incluent notamment :

- accueil boutique
- catalogue produits et fiche produit
- panier, checkout, confirmation et suivi
- dashboard client, commandes, retours, adresses, fidelite, avis, profil
- dashboard admin, commandes, produits, clients, retours, promotions, livraisons, fidelite, analytics, emails, parametres

Note d'implementation :

- les route groups Next.js sont utilises pour organiser le code
- les chemins publics restent fonctionnels et explicites, par exemple `/products`, `/account/...` et `/admin/...`
- des redirections de compatibilite peuvent exister temporairement pour les anciens chemins deja poses

## Fichiers de domaine demandes

La structure cible doit aussi inclure :

- `components/shop` avec les composants boutique
- `components/admin` avec les composants admin
- `lib/actions` segmente par domaine
- `lib/emails` pour les templates transactionnels/marketing
- `lib/utils/price.ts`, `lib/utils/points.ts`, `lib/utils/promo.ts`

## Base de donnees demandee

Le schema Shop doit inclure au minimum les tables suivantes :

- `customer_profiles`
- `customer_addresses`
- `products`
- `orders`
- `order_items`
- `returns`
- `return_items`
- `promotions`
- `promo_usages`
- `loyalty_transactions`
- `product_reviews`
- `email_campaigns`
- `delivery_persons`
- `delivery_zones`
- `stock_notifications`
- `abandoned_carts`
- `shop_settings`

## Attentes SQL complementaires

Le schema doit aussi prevoir :

- les indexes de performance utiles
- les politiques `RLS`
- les triggers `updated_at`
- la generation de reference commande `LFS-YYYY-NNNNN`
- la generation de reference retour `RET-YYYY-NNNNN`
- la mise a jour automatique du niveau fidelite
- la mise a jour du stock lors du cycle de commande

## Contraintes de qualite

- Ne pas faire un simple copier-coller du projet source
- Garder ce qui est bon dans `legend-farm`
- Corriger ce qui est bancal ou trop implicite
- Laisser une base claire pour les etapes suivantes
- Documenter les choix importants au fur et a mesure
- Eviter toute maquette trompeuse avec faux montants ou faux clients affiches comme si c'etait de la vraie data

## Fichiers de reference internes

- Journal d'avancement : `IMPLEMENTATION_LOG.md`
- Cadrage permanent : `PROJECT_BRIEF.md`
