# Legend Farm Shop - Journal de mise en oeuvre

## 2026-03-28

- Initialisation du journal de suivi.
- Creation directe du projet dans `/home/saikou/legend-farm-market` apres correction du flux de travail.
- Mise en place du socle technique : `Next.js`, `TypeScript`, `Tailwind`, helpers `Supabase`, `Sentry`, layout public, middleware et types de base.
- Decision volontaire : versions figees dans `package.json` au lieu de carets pour eviter la derive observee dans le projet source.
- Structure de routes ajoutee : accueil, `/shop`, `/cart`, `/checkout`, `/account`, `/orders`, `/login`, `/register`, `/admin` et sous-pages principales du back-office.
- Ajout de composants d interface reutilisables pour accelerer la suite : `Input`, `Label`, `ProductCard`, `AdminNav`, `not-found`.
- Ajustements de qualite : navigation admin corrigee pour utiliser le pathname reel, route API de login ajoutee avec rate limiting, et configs Sentry minimales alignees sur le `next.config.ts`.
- Ajout de `PROJECT_BRIEF.md` pour conserver toutes les consignes produit, techniques et organisationnelles donnees par le client.
- Migration `supabase/migrations/001_shop_foundation.sql` ajoutee avec schema shop complet, indexes, RLS, generation de references, gestion des niveaux fidelite et synchronisation du stock sur le cycle de commande.
- Correction de trajectoire : suppression des prix, commandes, promotions et clients factices codes en dur dans les pages au profit de lectures Supabase et d'etats vides propres.
- Ajout d'un vrai schema `staff_profiles` pour proteger le back-office et poser une base admin exploitable sans exposer les vues staff a tout utilisateur connecte.
- Ajout de helpers serveur `lib/actions/shop.ts` et `lib/actions/admin-shop.ts` pour centraliser les lectures publiques, client et admin depuis Supabase.
- Mise a jour du cadrage projet pour verrouiller explicitement la regle "pas de donnees metier codees en dur dans l interface".
- Realignement de l arborescence sur la structure cible : route groups `(shop)`, `(auth)`, `(account)` et `(admin)` avec chemins fonctionnels `/products`, `/account/...` et `/admin/...`.
- Ajout des pages de structure demandee pour le shop, l espace client et le back-office, avec redirections de compatibilite pour les anciens chemins deja poses.
- Ajout des composants demandes dans `components/shop` et `components/admin`.
- Ajout des fichiers de domaine demandes dans `lib/actions`, `lib/emails` et `lib/utils`.
- Refactor des layouts pour separer l enveloppe publique, l espace client et le back-office au lieu d un layout unique pour tout.
- Nettoyage de l integration Sentry vers `instrumentation.ts` / `instrumentation-client.ts` et ajout de `app/global-error.tsx` pour eviter les warnings de configuration de Next.js 15.
- Verification complete : `npm install` execute, puis `npm run build` valide avec succes sur la nouvelle structure.
