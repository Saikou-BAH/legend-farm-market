# Gestion des utilisateurs - Legend Farm Shop

## 1. Objectif du script

Le projet utilise `Supabase Auth` pour la gestion securisee des mots de passe et des sessions.

Le script [scripts/manage-users.ts](/home/saikou/legend-farm-market/scripts/manage-users.ts) permet d'administrer les comptes utiles au projet sans devoir tout faire manuellement dans le dashboard Supabase.

Il est concu pour rester strictement compatible avec les regles de securite suivantes :

- il ne lit jamais un mot de passe existant
- il n'affiche jamais un mot de passe existant
- il ne stocke jamais un mot de passe en clair dans un fichier local
- il ne contourne jamais `Supabase Auth`
- il distingue clairement les comptes `staff` et `customer`

## 2. Prerequis

- disposer des variables d'environnement requises dans `.env.local`
- avoir acces a la base Supabase du projet
- executer les commandes depuis la racine du projet
- avoir applique les migrations SQL du projet, y compris `002_staff_profiles_phone.sql`

## 3. Variables d'environnement necessaires

Variables effectivement utilisees par le script :

- `NEXT_PUBLIC_SUPABASE_URL`
  - URL de l'instance Supabase
- `SUPABASE_SERVICE_ROLE_KEY`
  - cle service role utilisee uniquement cote serveur / CLI
- `NEXT_PUBLIC_APP_URL`
  - utilisee pour construire le `redirect_to` du flux `reset-password`

Remarques :

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` n'est pas necessaire pour ce script CLI
- la `SUPABASE_SERVICE_ROLE_KEY` ne doit jamais etre exposee au navigateur

## 4. Differenciation entre comptes staff et comptes clients

### 4.1 Staff / admin

Les comptes internes reposent sur deux couches :

- `auth.users`
- `staff_profiles`

Le profil staff contient aujourd'hui :

- `id`
- `email`
- `full_name`
- `role`
- `phone`
- `is_active`
- `created_at`
- `updated_at`

Roles staff confirmes par le schema :

- `admin`
- `manager`
- `support`
- `logistics`

### 4.2 Clients

Les comptes clients reposent sur :

- `auth.users`
- `customer_profiles`

Le schema actuel ne contient pas de champ `customer_profiles.is_active`.

Consequence :

- la desactivation client se fait au niveau `Auth`
- le script ne pretend pas qu'un statut metier client existe si ce n'est pas vrai dans le schema

## 5. Installation et lancement

Le projet expose une commande npm dediee :

```bash
npm run users -- help
```

ou plus simplement :

```bash
npm run users help
```

## 6. Commandes disponibles

### 6.1 `help`

Afficher l'aide generale.

Exemple :

```bash
npm run users help
```

### 6.2 `list`

Lister les utilisateurs selon un scope.

Exemples :

```bash
npm run users list
npm run users list --scope=staff
npm run users list --scope=customers
```

Options :

- `--scope=staff|customers|all`
- `all` est la valeur par defaut

Comportement :

- `staff` liste les comptes relies a `staff_profiles`
- `customers` liste les comptes relies a `customer_profiles`
- `all` affiche les deux ensembles separement

### 6.3 `create-staff`

Creer un compte staff / admin.

Options :

- `--email=...` requis
- `--full-name=...` requis
- `--role=admin|manager|support|logistics` requis
- `--phone=...` optionnel
- `--temp-password=...` optionnel
- `--active=true|false` optionnel, `true` par defaut

Exemple :

```bash
npm run users create-staff --email=admin@legendfarm.gn --full-name="Admin Legend Farm" --role=admin --phone="+224..."
```

Comportement :

- si `--temp-password` est omis, le script genere un mot de passe temporaire fort
- le mot de passe temporaire est affiche une seule fois
- aucun mot de passe n'est stocke dans un fichier
- un indicateur `force_password_change` est enregistre dans `user_metadata.legend_farm`
- le site applique ensuite cet indicateur et force le passage par `/reset-password` tant que le mot de passe n'a pas ete remplace

### 6.4 `update`

Mettre a jour un utilisateur existant.

Ciblage :

- `--uid=...` ou `--email=...`

Options de mise a jour :

- `--scope=staff|customers` recommande si le type doit etre impose
- `--full-name=...`
- `--phone=...`
- `--role=...` pour le staff uniquement
- `--active=true|false`

Exemples :

```bash
npm run users update --email=admin@legendfarm.gn --scope=staff --role=manager
npm run users update --email=client@legendfarm.gn --scope=customers --full-name="Nouveau Nom"
npm run users update --uid=<uuid> --phone="+224..."
```

Comportement :

- le staff met a jour `staff_profiles`
- le client met a jour `customer_profiles`
- l'activation / desactivation agit aussi sur `Auth`

### 6.5 `disable`

Desactiver un compte sans le supprimer.

Exemples :

```bash
npm run users disable --email=admin@legendfarm.gn --scope=staff
npm run users disable --email=client@legendfarm.gn --scope=customers
```

Comportement :

- pour le staff : `staff_profiles.is_active = false` + blocage Auth
- pour le client : blocage Auth uniquement

### 6.6 `enable`

Reactiver un compte precedemment desactive.

Exemples :

```bash
npm run users enable --email=admin@legendfarm.gn --scope=staff
npm run users enable --email=client@legendfarm.gn --scope=customers
```

Comportement :

- pour le staff : `staff_profiles.is_active = true` + deban Auth
- pour le client : deban Auth uniquement

### 6.7 `delete`

Supprimer definitivement un compte.

Exigence de securite :

- confirmation obligatoire avec `--confirm=DELETE`

Exemple :

```bash
npm run users delete --email=ancien@legendfarm.gn --scope=staff --confirm=DELETE
```

Comportement :

- suppression du compte Auth
- suppression du profil associe si present
- operation irreversible

### 6.8 `info`

Afficher les informations utiles d'un utilisateur.

Exemples :

```bash
npm run users info --email=admin@legendfarm.gn
npm run users info --uid=<uuid>
```

Le script affiche selon disponibilite :

- email
- UID
- type d'utilisateur
- nom complet
- role staff si applicable
- statut actif / inactif
- date de creation
- derniere connexion si accessible via `auth.users`
- presence ou absence du profil applicatif associe

### 6.9 `set-temp-password`

Definir un nouveau mot de passe temporaire pour un utilisateur.

Exemples :

```bash
npm run users set-temp-password --email=client@legendfarm.gn
npm run users set-temp-password --email=admin@legendfarm.gn --temp-password="Temporaire123!"
```

Comportement :

- si `--temp-password` est omis, le script genere un mot de passe temporaire fort
- le mot de passe temporaire est affiche une seule fois
- ne lit jamais le mot de passe existant
- n'essaie jamais de recuperer un ancien mot de passe
- ecrit uniquement un nouveau mot de passe temporaire via Supabase Auth
- pose `force_password_change = true` dans `user_metadata.legend_farm`
- le site redirige ensuite l'utilisateur vers `/reset-password` a la prochaine connexion ou au prochain acces protege

Recommandation de securite :

- preferer laisser le script generer un mot de passe temporaire
- transmettre ce mot de passe par un canal securise
- demander a l'utilisateur de le changer immediatement

### 6.10 `reset-password`

Generer un lien de reinitialisation de mot de passe via Supabase.

Exemples :

```bash
npm run users reset-password --email=client@legendfarm.gn
npm run users reset-password --email=client@legendfarm.gn --redirect-to=https://shop.legendfarm.gn/reset-password
```

Comportement :

- utilise `generateLink({ type: 'recovery' })`
- retourne un lien de reinitialisation securise
- ne lit jamais l'ancien mot de passe
- n'envoie pas lui-meme l'email

Important :

- ce script ne fait que generer le lien
- le partage du lien doit se faire via un canal securise
- le projet contient maintenant un vrai parcours frontend `/forgot-password` -> `/reset-password` branche sur Supabase Auth
- si le besoin est immediat cote exploitation, `set-temp-password` reste aussi une option fiable pour assister un utilisateur

## 7. Regles de securite

Le script respecte volontairement les regles suivantes :

- aucun mot de passe existant n'est lisible
- aucun mot de passe existant n'est affichable
- aucun mot de passe n'est stocke en clair dans un fichier local
- aucune base locale parallele de credentials n'est creee
- les operations de mot de passe passent par Supabase Auth uniquement
- les roles staff sont valides strictement
- les emails sont valides strictement
- les actions destructrices exigent une confirmation explicite
- les logs n'affichent pas la `SUPABASE_SERVICE_ROLE_KEY`
- les sorties console evitent les donnees sensibles inutiles

## 8. Erreurs frequentes

### Commande inconnue

Symptome :

- `Erreur: Commande inconnue: create. Lance "npm run users help".`

Cause probable :

- utilisation de `create` au lieu de `create-staff`
- utilisation de `--name` au lieu de `--full-name`

Action :

- la bonne commande est `create-staff` avec `--full-name`

```bash
npm run users -- create-staff --email=admin@legendfarm.gn --full-name="Prenom Nom" --role=admin
```

Note : le `--` entre `users` et `create-staff` garantit que npm transmet bien les arguments au script.

### Variable manquante

Symptome :

- erreur du type `Missing required environment variable`

Cause probable :

- `.env.local` incomplet

Action :

- verifier `NEXT_PUBLIC_SUPABASE_URL`
- verifier `SUPABASE_SERVICE_ROLE_KEY`
- verifier `NEXT_PUBLIC_APP_URL`

### Utilisateur introuvable

Symptome :

- le script indique qu'aucun utilisateur ne correspond

Cause probable :

- mauvais email
- mauvais UID
- mauvais scope

Action :

- relancer avec `list`
- relancer avec `--scope=staff` ou `--scope=customers`
- verifier si cette situation est voulue

## 9. Limites connues

Limites confirmees par le code actuel :

- la gestion fine des permissions par role staff n'est pas encore implemente cote application
- la desactivation des clients repose sur l'acces Auth, pas sur un champ `customer_profiles.is_active` qui n'existe pas dans le schema actuel
- le flux de reset password depend toujours de la configuration email de Supabase et de `NEXT_PUBLIC_APP_URL`
- le flag `force_password_change` est bien applique par le middleware et la page `/reset-password`, mais la qualite finale dependra aussi des futurs parcours UX autour du compte client et du back-office

## 10. Scenarios courants

### Creation d'un nouvel admin

```bash
npm run users create-staff --email=admin@legendfarm.gn --full-name="Admin Legend Farm" --role=admin
```

Resultat attendu :

- le compte Auth est cree
- le profil `staff_profiles` est cree
- un mot de passe temporaire est affiche une fois
- le prochain passage par le site force le changement du mot de passe

### Creation d'un nouveau membre du staff

```bash
npm run users create-staff --email=support@legendfarm.gn --full-name="Support Legend Farm" --role=support --phone="+224..."
```

### Desactivation d'un employe

```bash
npm run users disable --email=support@legendfarm.gn --scope=staff
```

Resultat attendu :

- le profil staff passe inactif
- le compte Auth est bloque

### Reset password d'un client

```bash
npm run users reset-password --email=client@legendfarm.gn
```

Resultat attendu :

- un lien de reset securise est genere
- l'utilisateur peut finir le parcours sur `/reset-password`

### Changement de role

```bash
npm run users update --email=manager@legendfarm.gn --scope=staff --role=admin
```

### Suppression definitive

```bash
npm run users delete --email=ancien@legendfarm.gn --scope=staff --confirm=DELETE
```

## 11. Ce que le script ne fait volontairement pas

Le script ne fera jamais les choses suivantes :

- afficher les mots de passe existants
- stocker les mots de passe en clair dans un fichier local
- tenir un registre local de mots de passe
- contourner la securite Supabase
- exposer la `SUPABASE_SERVICE_ROLE_KEY` au navigateur
- inventer un champ `is_active` client qui n'existe pas dans le schema actuel
- pretendre qu'un mot de passe existant peut etre recupere

## 12. Commandes de test recommandees

Commandes locales sans action destructive :

```bash
npm run users help
npm run users list --scope=staff
npm run users list --scope=customers
npm run users info --email=admin@legendfarm.gn
```

Commandes de demonstration a utiliser avec prudence :

```bash
npm run users create-staff --email=test-admin@legendfarm.gn --full-name="Test Admin" --role=admin
npm run users set-temp-password --email=test-admin@legendfarm.gn
npm run users reset-password --email=test-admin@legendfarm.gn
npm run users disable --email=test-admin@legendfarm.gn --scope=staff
npm run users enable --email=test-admin@legendfarm.gn --scope=staff
```
