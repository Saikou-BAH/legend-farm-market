# Roadmap Site Ecommerce Legend Farm

## 1. Resume de depart

Le projet actuel est un socle e-commerce credible, mais ce n'est pas encore un site marchand complet.
Le code confirme une base technique serieuse, une architecture propre, une integration Supabase, un schema SQL riche, une separation claire entre boutique publique, espace client et back-office admin, ainsi qu'un middleware de protection et une instrumentation Sentry.

### Existant confirme

- application Next.js App Router avec pages publiques, pages d'auth, espace client et espace admin
- integration Supabase pour les lectures principales de produits, zones de livraison, profils clients, commandes, promotions, parametres boutique et acces staff
- migration SQL locale riche avec tables e-commerce, RLS, indexes et triggers
- middleware de protection pour `/account`, `/orders`, `/checkout` et `/admin`
- pages de lecture partielle cote client et cote admin
- formatage des montants en GNF
- structure UI coherente avec Tailwind CSS, shadcn/ui et un design system simple
- instrumentation Sentry et observabilite technique de base

### Blocs critiques initialement manquants et maintenant traites

- authentification UI complete
- inscription, reset password et logout
- panier fonctionnel et persistant
- checkout reel et creation de commande
- socle de paiement transactionnel exploitable
- admin en ecriture avec permissions plus fines
- gestion des images produits
- detail des commandes fiable par id
- contact, WhatsApp et emails utiles relies au site
- parcours d'achat complet pour le lancement actuel

### Point de cadrage

Le projet doit etre pilote comme une construction progressive d'un vrai canal de vente.
La priorite n'est pas d'ajouter beaucoup d'ecrans, mais de rendre fiables les flux critiques: auth, panier, checkout, commande, admin et communication client.

## 2. Vision cible du site final

Le site final doit etre une boutique en ligne Legend Farm professionnelle, claire, rassurante et attractive.
Il doit donner envie d'acheter grace a une presentation propre des produits, des photos de qualite, des prix lisibles, des informations utiles et un parcours d'achat sans friction.

### Positionnement du site

- boutique officielle de Legend Farm
- vente directe de produits fermiers avec image de qualite et serieux operationnel
- experience a la fois B2C et adaptee a certains usages professionnels
- boutique alignee avec la realite de la ferme: disponibilite, prix, livraison, suivi

### Experience client attendue

- comprendre immediatement ce que vend Legend Farm
- voir des produits bien presentes et bien photographies
- comprendre vite le prix, l'unite, la disponibilite et les conditions de livraison
- pouvoir creer un compte sans friction
- pouvoir ajouter, modifier et supprimer des articles du panier facilement
- passer commande de maniere rassurante et claire
- suivre sa commande et retrouver ses historiques sans confusion
- contacter facilement la ferme par email, telephone ou WhatsApp
- recevoir des emails utiles, propres et non intrusifs
- ressentir une image de marque serieuse, humaine et professionnelle

### Experience admin attendue

- se connecter a un espace admin securise et lisible
- creer, modifier, desactiver et organiser les produits facilement
- gerer les prix, les photos, la disponibilite et idealement le stock
- consulter, filtrer et mettre a jour les commandes rapidement
- consulter les clients et leurs informations utiles
- gerer les promotions, les campagnes et les parametres boutique
- disposer d'un historique utile des operations sensibles
- piloter le site sans dependre de manipulations techniques fragiles

### Niveau de qualite attendu

- logique metier fiable
- UX simple et rassurante
- forte coherence entre front public et back-office
- bon niveau de robustesse avant mise en production
- bon rendu mobile
- performances raisonnables
- SEO technique propre
- observabilite, controle des erreurs et securite minimales de production

### Ton visuel, commercial et confiance

Le site final doit inspirer la fraicheur, la qualite, la proximite et le serieux.
Le ton doit etre propre, chaleureux, vendeur sans etre agressif, avec un vrai travail de reassurance: livraison, contact, provenance, disponibilite, qualite des produits, clarte des prix et fluidite du parcours.

## 3. Principes produit et UX a respecter

- simplicite: chaque ecran doit aller a l'essentiel
- confiance: prix, disponibilite, livraison et contact doivent etre clairs
- clarte: aucun doute sur ce que le client achete et comment il commande
- rapidite: peu d'etapes, peu de frictions, peu de confusion
- informations utiles: description, unite, stock ou disponibilite, delais, moyens de contact
- photos propres: visuels nets, coherents, rassurants
- prix lisibles: montants en GNF, hierarchie visuelle claire, unites explicites
- disponibilite claire: produit disponible, indisponible, bientot disponible, stock limite si pertinent
- contact facile: point de contact visible et accessible depuis les pages utiles
- responsive mobile: experience aussi propre sur mobile que sur desktop
- parcours d'achat fluide: ajout au panier, recap, validation et confirmation sans ambiguites
- admin simple mais puissant: peu d'ecrans inutiles, beaucoup d'efficacite
- coherence boutique/back-office: les informations admin doivent piloter la vitrine et non vivre a part
- priorite au concret: terminer un flux utile avant d'ouvrir dix nouveaux chantiers

## 4. Ce qui existe deja (confirme par le code)

### Architecture actuelle

- application Next.js App Router avec 4 surfaces: boutique publique, auth, compte client, admin
- server actions de lecture centralisees dans `lib/actions`
- middleware de protection pour les zones privees
- design system simple base sur Tailwind et shadcn/ui

### Supabase

- clients navigateur, serveur et service role en place
- lecture de donnees depuis Supabase deja utilisee dans plusieurs pages
- schema SQL local deja riche et coherent pour un e-commerce
- RLS activee et triggers importants deja prevus

### Pages publiques

- home publique
- catalogue produits
- fiche produit
- panier fonctionnel et persistant
- checkout reel
- confirmation commande sur vraie commande
- suivi commande sur vraies donnees
- page livraison
- page contact
- pages legales

### Espace client

- dashboard client
- liste des commandes
- detail complet d'une commande avec lignes et paiements
- adresses gerables
- fidelite avec historique recent
- profil editable
- retours clients reels
- avis clients reels

### Espace admin

- dashboard admin avec journal recent
- gestion des commandes, statuts et paiements
- gestion des produits, medias et moderation des avis
- gestion des clients
- gestion des promotions
- gestion des zones de livraison
- vue fidelite avec transactions recentes
- gestion des parametres boutique
- gestion des campagnes email
- gestion des retours
- analytics admin avec indicateurs, barres comparatives et exports CSV

### Observabilite et securite deja presentes

- Sentry branche
- middleware de protection d'acces
- distinction session client / service role admin
- rate limit sur le login API

### Lectures DB existantes

- produits publics
- produits admin
- donnees home
- profil client et adresses
- commandes client
- dashboard admin
- commandes admin
- clients admin
- promotions admin
- zones de livraison admin
- parametres boutique admin

### Schema SQL riche

Le schema local couvre deja de nombreuses dimensions importantes:

- profils clients
- adresses
- staff admin
- produits
- promotions
- commandes
- lignes de commande
- retours
- fidelite
- avis produits
- campagnes email
- zones de livraison
- notifications stock
- paniers abandonnes
- parametres boutique

## 5. Ce qui manque encore

### Prerequis externes ou extensions post-lancement

- configuration effective de `RESEND_API_KEY` et `RESEND_FROM_EMAIL` pour les envois en production
- configuration effective de `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` pour un rate limit distribue
- application des migrations locales sur le projet Supabase distant, y compris `006_loyalty_checkout_settings.sql`
- verification operationnelle du bucket `product-media` sur le projet Supabase distant
- synchronisation panier multi-appareil cote serveur si ce besoin devient prioritaire
- analytics plus pousses avec exports PDF ou Excel si le pilotage metier le demande
- automatisations marketing et fidelite plus riches apres stabilisation du lancement
- eventuelle integration d un provider de paiement temps reel si la strategie commerciale evolue

## 6. Roadmap complete en phases

### PHASE 0 - Stabilisation et cadrage technique

**Statut actuel**

Finalisee pour le lancement actuel.
Les lectures par `id`, la clarification des placeholders, la base technique de reference, l hygiene initiale et l alignement des variables critiques ont ete traites.

**Objectif**

Stabiliser le socle avant toute extension metier pour eviter de construire des flux critiques sur une base fragile ou confuse.

**Pourquoi cette phase arrive maintenant**

Le projet contient deja plusieurs lectures reelles mais aussi des incoherences techniques bloquantes.
Il faut d'abord corriger les details par id, clarifier les types, les variables et les placeholders, sinon les phases suivantes accumuleront de la dette tres vite.

**Existant confirme**

- lectures critiques par `id` fiabilisees
- fiche admin produit decouplee de la logique publique
- baseline technique documentee
- `.env.example` aligne sur les flux reellement utilises
- placeholders critiques identifies et explicitement assumes
- types utilitaires enrichis sur les entites effectivement manipulees

**Ce qui manque**

- alignement TypeScript encore plus exhaustif si le schema continue de s elargir

**Ce qu'il faut construire**

- un socle de lecture fiable, coherent et maintenable
- une cartographie technique de reference
- des conventions claires pour les phases metier suivantes

**Dependances**

- aucune dependance fonctionnelle amont

**Risques**

- continuer le developpement sans corriger les details par id
- conserver des types incomplets qui masquent des oublis metier
- lancer l'admin en ecriture sans clarifier les sources de donnees

**Taches detaillees**

- remplacer les recherches locales dans des listes limitees par des requetes directes par id pour les commandes client
- remplacer les recherches locales dans des listes limitees par des requetes directes par id pour les commandes admin
- corriger la fiche admin produit pour qu'elle interroge un produit admin complet, y compris indisponible
- lister les colonnes SQL utiles par entite et aligner les types TypeScript sur ces colonnes
- decider quelles interfaces TS doivent couvrir l'exhaustivite du schema et lesquelles doivent rester des vues reduites
- clarifier dans le code quelles pages sont des placeholders assumes et lesquelles doivent etre considerees comme deja partiellement fonctionnelles
- reviser `.env.example` pour integrer toutes les variables reellement utiles au projet et a la production
- verifier les helpers utilitaires existants et marquer ceux a conserver, a brancher rapidement ou a supprimer plus tard
- documenter les tables deja branchees et les tables encore non utilisees par l'application
- preparer une base technique propre pour les mutations futures

**Criteres d'acceptation**

- le detail d'une commande ancienne reste accessible par id
- le detail d'une commande admin ancienne reste accessible par id
- un produit indisponible reste accessible dans sa fiche admin
- les types TS utiles couvrent les champs metier reellement manipules
- `.env.example` liste les variables d'environnement necessaires aux flux prevus
- chaque placeholder important est identifie comme tel et non confondu avec une fonctionnalite finie

**Statut attendu a la fin de la phase**

Socle technique clarifie, lectures fiables, types alignes sur les besoins immediats, terrain propre pour lancer les flux metier.

### PHASE 1 - Authentification complete et securisee

**Statut actuel**

Finalisee pour le lancement actuel.
Le front auth, le reset password, le logout, le middleware et la gestion securisee des utilisateurs ont ete branches.

**Objectif**

Rendre l'authentification reellement utilisable depuis l'UI pour les clients et les admins, sans contournement.

**Pourquoi cette phase arrive a ce moment**

Toutes les zones privees du site dependent deja du middleware.
Tant que l'auth UI n'est pas terminee, le reste du parcours prive restera bloque ou artificiel.

**Existant confirme**

- middleware de protection
- routes `login`, `register`, `forgot-password`, `reset-password` et `logout`
- callback auth
- validations, redirections et messages d erreur branches
- gestion securisee des utilisateurs via CLI admin
- enforcement du flag `force_password_change`

**Ce qui manque**

- integrations email externes a verifier en production selon la configuration Supabase Auth

**Ce qu'il faut construire**

- auth UI complete
- experience de connexion claire pour client et admin
- fondation fiable des parcours prives

**Dependances**

- Phase 0 recommandee terminee

**Risques**

- connecter partiellement le login sans traiter register et reset
- ignorer les redirections et casser l'UX apres connexion
- ne pas differencier correctement les cas client, profil incomplet et staff

**Taches detaillees**

- creer le formulaire de login et le brancher au handler existant
- afficher les erreurs de login de maniere claire et rassurante
- gerer la redirection apres connexion vers la route `next` ou la destination par defaut
- creer le flux d'inscription client avec creation du compte auth puis du `customer_profile`
- definir le comportement d'inscription quand le profil client doit etre complete en plusieurs etapes
- creer le flux forgot password et reset password avec pages et messages adaptes
- ajouter le logout dans l'interface publique / compte / admin selon les besoins UX retenus
- renforcer l'accessibilite des formulaires avec vraies balises `form`, labels, validation et feedback
- verifier les redirections du middleware pour client et admin
- clarifier les messages d'etat pour utilisateur connecte sans `customer_profile`

**Criteres d'acceptation**

- un utilisateur peut se connecter depuis l'UI sans passer par un contournement
- un utilisateur peut creer un compte depuis l'UI
- un utilisateur peut demander un reset password depuis l'UI
- un utilisateur connecte peut se deconnecter
- les pages protegees redirigent proprement vers login puis reviennent vers la bonne page apres connexion
- les formulaires affichent des messages d'erreur compréhensibles

**Statut attendu a la fin de la phase**

Authentification complete, utilisable et stable, ouvrant reellement les parcours compte client et admin.

### PHASE 2 - Catalogue vendeur et credible

**Statut actuel**

Finalisee pour le lancement actuel.
Le catalogue public dispose maintenant d une home plus rassurante, d un catalogue filtrable, de fiches produit credibles, d images propres, d un contact visible et d une navigation mobile exploitable.

**Objectif**

Transformer le catalogue actuel en une vraie vitrine marchande qui donne envie d'acheter.

**Pourquoi cette phase arrive a ce moment**

Une fois l'auth operationnelle, la boutique doit devenir commercialement convaincante avant meme d'ouvrir le panier et le checkout.

**Existant confirme**

- home publique renforcee
- catalogue filtrable avec recherche
- fiches produit riches avec medias, paliers de prix et contact utile
- montant en GNF uniformise
- disponibilite, badges et categorisation visibles

**Ce qui manque**

- pagination ou tri plus pousse si le catalogue grossit fortement

**Ce qu'il faut construire**

- un catalogue beau, lisible et vendeur
- une fiche produit claire, complete et rassurante
- des outils d'exploration efficaces pour le client

**Dependances**

- Phase 1 recommandee
- Phase 3 concernera la gestion technique des medias, mais une premiere mise en valeur du catalogue peut commencer avant si des fallbacks existent

**Risques**

- investir dans le visuel sans regler la structure de donnees produits
- ajouter recherche et filtres trop tot sans clarifier les categories
- surcharger les cartes produits et perdre la simplicite

**Taches detaillees**

- revoir la home pour mettre en avant les produits, la confiance, la livraison et le contact
- redesign des cartes produits pour afficher informations utiles et CTA clairs
- enrichir la fiche produit avec prix, unite, disponibilite, images, argumentaire et reassurance
- definir une logique de categories ou de classement exploitable dans l'UI
- ajouter une recherche produit cote catalogue
- ajouter des filtres pertinents: categorie, disponibilite, eventuellement type de produit ou gamme
- ajouter un tri pertinent si necessaire
- definir une pagination ou un chargement progressif si le catalogue grossit
- clarifier les badges utiles: nouveaute, disponible, rupture, mis en avant, stock limite si retenu
- aligner le ton visuel et le message commercial avec l'image Legend Farm

**Criteres d'acceptation**

- un visiteur comprend rapidement ce que vend Legend Farm
- un visiteur peut parcourir le catalogue facilement
- une fiche produit affiche des informations suffisamment claires pour acheter
- la recherche et les filtres renvoient des resultats coherents
- les prix en GNF restent lisibles et coherents partout
- le catalogue parait plus credible, plus rassurant et plus vendeur qu'au depart

**Statut attendu a la fin de la phase**

Catalogue public convaincant, utile et structure, pret a supporter un vrai parcours panier.

### PHASE 3 - Gestion des medias produits

**Statut actuel**

Finalisee pour le lancement actuel.
Le socle Storage, l upload admin, la suppression, le reordonnancement, l image principale et les rendus publics sont branches.

**Objectif**

Donner a l'admin une vraie maitrise des images produits et garantir un rendu propre cote client.

**Pourquoi cette phase arrive a ce moment**

Le catalogue doit devenir vendeur. Les medias influencent directement la confiance, la conversion, la perception de qualite et la clarte produit.

**Existant confirme**

- bucket `product-media` prevu par migration dediee
- configuration Next.js pour autoriser les images Supabase Storage
- upload admin, suppression, reordonnancement et image principale branches
- rendu public avec fallback visuel propre sur catalogue et fiche produit

**Ce qui manque**

- controles editoriaux plus pousses si l equipe veut normer davantage les medias
- optimisations supplementaires si le volume image grossit fortement

**Ce qu'il faut construire**

- pipeline media simple, fiable et maintenable
- affichage image propre en liste, detail et admin
- regles editoriales minimales pour la qualite visuelle

**Dependances**

- Phase 0 pour clarifier les produits
- Phase 8 pour brancher l'admin complet

**Risques**

- commencer par l'UI sans definir une vraie convention media
- stocker des URLs sans structure ni regles
- ne pas prevoir de fallback visuel propre

**Taches detaillees**

- choisir la strategie de stockage image produit
- definir la structure des chemins et des noms de fichiers si necessaire
- creer le flux d'upload image dans l'admin
- gerer l'image principale et l'ordre des images
- permettre la suppression et le remplacement d'images existantes
- afficher les images dans les cartes produit
- afficher une galerie propre dans la fiche produit
- creer un fallback image robuste si aucune image n'est disponible
- fixer les contraintes de taille, format, compression et dimensions
- verifier les performances de chargement image sur mobile

**Criteres d'acceptation**

- un admin peut ajouter au moins une image a un produit
- un admin peut remplacer ou supprimer une image produit
- un produit peut afficher une image principale en liste et une galerie en detail
- le rendu reste propre si un produit n'a pas d'image
- les images sont correctement optimisees pour une boutique publique

**Statut attendu a la fin de la phase**

Gestion des medias produits fiable et experience visuelle nettement plus rassurante.

### PHASE 4 - Panier fonctionnel et persistant

**Statut actuel**

Finalisee pour le lancement actuel.
Le panier local persistant, l ajout depuis les produits, la mise a jour des quantites, les validations de disponibilite et le recap exploitable sont maintenant branches.

**Objectif**

Permettre au client de preparer un achat de maniere reelle, visible et cohérente.

**Pourquoi cette phase arrive a ce moment**

Une fois le catalogue credible, il faut rendre possible l'intention d'achat avant de travailler le checkout.

**Existant confirme**

- hook client `useCart` avec persistance `localStorage`
- ajout au panier depuis les cartes produit et la fiche produit
- page `/cart` reliee aux vraies lignes du panier
- recap des montants et validation des lignes avant checkout

**Ce qui manque**

- synchronisation panier apres connexion ou multi-appareil
- persistance serveur si le produit final le demande

**Ce qu'il faut construire**

- vrai panier client
- mecanique de calcul claire et robuste
- base de validation avant checkout

**Dependances**

- Phase 2 et Phase 3 recommandees
- Phase 5 depend fortement de cette phase

**Risques**

- choisir une persistance trop complexe trop tot
- ne pas traiter les cas de produit indisponible ou modifie
- afficher des totaux non fiables

**Taches detaillees**

- choisir la strategie de persistance panier: local, base, ou hybride
- brancher le bouton d'ajout au panier depuis les cartes et la fiche produit
- permettre la modification de quantite
- permettre la suppression d'un article
- afficher un sous-total et un total clairs
- preparer la prise en compte future des frais de livraison et promotions
- valider la disponibilite produit au moment de l'affichage du panier
- gerer les cas de produit desactive, prix modifie ou stock insuffisant
- clarifier l'UX du panier vide, du panier invalide et du panier pret a commander
- si necessaire, preparer la recuperation du panier apres connexion

**Criteres d'acceptation**

- un client peut ajouter un produit au panier
- un client peut modifier la quantite d'un produit
- un client peut retirer un produit du panier
- le panier survit a un rechargement de page selon la strategie retenue
- les montants affiches sont coherents et lisibles
- les cas limites de disponibilite sont signales proprement

**Statut attendu a la fin de la phase**

Panier exploitable, fiable et pret a alimenter un vrai checkout.

### PHASE 5 - Checkout et creation de commande

**Statut actuel**

Finalisee pour le lancement actuel.
Le checkout cree de vraies commandes et lignes de commande, relit les produits cote serveur, affiche une confirmation reelle et alimente le suivi.

**Objectif**

Permettre au client de passer une vraie commande de bout en bout.

**Pourquoi cette phase arrive a ce moment**

Le checkout doit s'appuyer sur un panier stable et une auth deja operationnelle.

**Existant confirme**

- route checkout protegee
- formulaire de checkout relie au panier client
- relecture des produits et recalcul des montants cote serveur
- creation reelle des lignes `orders` et `order_items`
- page `/order-confirmation/[id]` basee sur une vraie commande
- page `/track/[id]` basee sur le vrai statut de commande
- tables `orders` et `order_items` deja prevues dans le schema

**Ce qui manque**

- creation d adresse inline dans le checkout si l on veut reduire encore la friction
- durcissement supplementaire contre les doubles soumissions si le trafic augmente
- enrichissement du suivi si le cycle logistique devient plus fin

**Ce qu'il faut construire**

- vrai flux de commande
- vraie persistence en base
- point de bascule clair entre panier et commande

**Dependances**

- Phase 1 et Phase 4 terminees
- Phase 6 utile ensuite pour le paiement

**Risques**

- creer la commande sans verrouiller les validations finales
- gerer les doublons de soumission trop tard
- oublier de stocker les snapshots utiles dans `order_items`

**Taches detaillees**

- definir les etapes exactes du checkout
- recuperer ou creer les adresses client utiles au checkout
- permettre la selection d'une adresse et d'une zone de livraison
- calculer le recap commande final avec sous-total, frais, remises et total
- creer la mutation de creation de commande
- creer la mutation de creation des lignes `order_items`
- definir le statut initial de commande et le statut paiement initial
- prevenir les doubles soumissions et les doublons accidentels
- gerer les erreurs de disponibilite finale ou de donnees manquantes
- creer une page de confirmation basee sur une vraie commande en base
- verifier la coherence entre la commande creee et le contenu du panier valide

**Criteres d'acceptation**

- un client authentifie peut passer une commande depuis l'UI
- une ligne `orders` reelle est creee en base
- des lignes `order_items` reelles sont creees en base
- le total final en base correspond au recap montre au client
- la page de confirmation est basee sur une vraie commande
- un double clic ou double envoi ne cree pas des doublons non controles

**Statut attendu a la fin de la phase**

Commande reelle possible depuis le site, avec persistence fiable et confirmation claire.

### PHASE 6 - Paiement et statut transactionnel

**Statut actuel**

Finalisee pour la strategie de lancement actuelle.
Le site dispose maintenant d un modele transactionnel interne propre, compréhensible et exploitable sans provider externe branche.

**Objectif**

Gerer proprement la logique de paiement, meme si le provider final est decide plus tard.

**Pourquoi cette phase arrive a ce moment**

La commande doit exister avant de structurer un modele transactionnel propre et coherent.

**Existant confirme**

- champs `payment_method` et `payment_status` dans `orders`
- table `payment_transactions` ajoutee dans les migrations
- transaction initiale `pending` creee au checkout quand la migration est appliquee
- details client/admin relies a l historique transactionnel
- enregistrement manuel admin d un encaissement, acompte, echec ou remboursement
- aucune integration provider externe pour l instant

**Ce qui manque**

- integration provider future si le lancement l exige plus tard
- eventuels webhooks ou callback provider
- automatisations supplementaires qui relevent d une future evolution, pas du socle actuel

**Ce qu'il faut construire**

- un socle transactionnel propre
- une logique de statuts stable et comprehensible
- une preparation robuste a une integration provider si necessaire
- un outillage admin simple pour piloter les statuts sans passer par Supabase Studio

**Dependances**

- Phase 5 terminee

**Risques**

- melanger statut commande et statut paiement sans rigueur
- integrer un provider trop tot sans modele interne clair
- ne pas prevoir les cas d'echec et de reprise

**Taches detaillees**

- arbitrer la strategie de paiement cible a court terme et moyen terme
- definir les statuts paiement reellement utilises par le site
- decider s'il faut une table dediee de transactions ou un historique associe
- definir le comportement des commandes en cas de succes, attente, echec, annulation ou paiement partiel
- clarifier les moyens de paiement reels supportes au lancement
- preparer l'integration d'un provider si retenu plus tard
- assurer la coherence entre `payment_status`, `order.status` et les actions admin
- definir les regles de reessai, reprise ou annulation si necessaire

**Criteres d'acceptation**

- chaque commande a un statut paiement coherent et interpretable
- les cas succes, echec et annulation sont geres sans ambiguites
- le modele retenu est suffisamment propre pour supporter un provider futur
- l'admin comprend l'etat transactionnel d'une commande sans lecture technique du schema

**Statut attendu a la fin de la phase**

Modele paiement propre et stable, pret pour une exploitation reelle ou une future integration provider.

### PHASE 7 - Compte client complet

**Statut actuel**

Finalisee pour le lancement actuel.

**Objectif**

Offrir un espace client utile apres achat et pas seulement un tableau de lecture minimal.

**Pourquoi cette phase arrive a ce moment**

Une fois auth, panier, checkout et commande en place, le compte client devient un vrai levier de confiance et de fidelisation.

**Existant confirme**

- dashboard client de base
- historique simple
- detail simple de commande
- profil et adresses en lecture
- fidelite en lecture
- edition du profil client
- gestion complete des adresses client
- detail commande enrichi avec lignes, suivi et paiement
- dashboard client avec raccourcis utiles apres achat
- creation de retours client avec lignes de commande
- espace avis client relie aux commandes livrees
- historique recent des transactions de fidelite

**Ce qui manque**

- enrichissements futurs possibles sur le SAV et la fidelite

**Ce qu'il faut construire**

- vrai espace client utile et rassurant
- coherence entre commande, historique, suivi et relation client

**Dependances**

- Phase 1 et Phase 5 au minimum
- Phase 6 utile pour la partie paiement

**Risques**

- laisser l'espace client incoherent avec les nouvelles donnees de commande
- garder des details de commande trop pauvres apres mise en production

**Taches detaillees**

- enrichir le dashboard client avec informations vraiment utiles
- rendre l'historique de commandes fiable et complet
- afficher les lignes de commande dans le detail
- afficher l'etat livraison et l'etat paiement de maniere comprehensible
- permettre l'edition du profil client
- permettre la gestion des adresses depuis l'espace client
- clarifier la page de suivi commande pour qu'elle reflete un vrai statut
- permettre au client de laisser un avis sur les produits deja achetes et livres
- ameliorer les etats vides et messages du compte client

**Criteres d'acceptation**

- un client peut modifier son profil
- un client peut gerer ses adresses
- un client retrouve toutes ses commandes utiles
- le detail d'une commande affiche ses lignes et ses informations importantes
- le suivi commande est alimente par de vraies donnees
- l'espace client donne une vraie impression de service apres achat

**Statut attendu a la fin de la phase**

Compte client complet, utile et coherent avec l'experience d'achat reelle.

### PHASE 8 - Back-office admin reellement exploitable

**Statut actuel**

Finalisee pour le lancement actuel.
Le back-office permet maintenant de creer et modifier produits, promotions, parametres, clients, commandes, paiements et campagnes email, avec permissions plus fines et journal admin recent.

**Objectif**

Rendre le back-office capable de faire vivre le site au quotidien.

**Pourquoi cette phase arrive a ce moment**

Le site ne peut pas etre pilote en production sans un admin en ecriture solide.

**Existant confirme**

- dashboard admin actif avec journal recent
- CRUD produits, promotions, clients, parametres et campagnes email
- gestion des commandes, paiements, retours et moderation d avis
- permissions staff plus fines sur les mutations
- service role cote serveur pour les operations admin sensibles

**Ce qui manque**

- outils analytiques et historiques encore plus fins si les operations grandissent

**Ce qu'il faut construire**

- back-office quotidiennement exploitable
- logique d'administration fiable et claire
- garde-fous suffisants pour les operations sensibles

**Dependances**

- Phase 0 terminee
- Phases 3, 5 et 6 apportent deja une base fonctionnelle a administrer

**Risques**

- faire un admin lourd et confus
- ouvrir l'ecriture sans regles de permission suffisantes
- oublier l'historique ou la tracabilite des changements sensibles

**Taches detaillees**

- creer les formulaires admin de creation produit
- creer les formulaires admin d'edition produit
- gerer la desactivation ou suppression logique d'un produit
- gerer les prix, la disponibilite et l'etat de publication des produits
- si retenu, gerer un stock simple et compréhensible
- creer la vue detail commande admin avec toutes les informations utiles
- permettre le changement de statut commande
- permettre la mise a jour du statut paiement selon le modele retenu
- afficher et enrichir les informations client utiles cote admin
- permettre la creation et l'edition de promotions
- permettre l'edition des parametres boutique
- introduire une gestion de permissions par role staff plus fine
- definir un historique utile des operations importantes: changement prix, statut commande, desactivation produit, etc.

**Criteres d'acceptation**

- un admin peut creer un produit
- un admin peut modifier un produit existant
- un admin peut desactiver un produit sans casser la vitrine
- un admin peut mettre a jour le prix et la disponibilite
- un admin peut changer le statut d'une commande
- les permissions staff ne donnent plus le meme acces a tous les roles
- les operations importantes laissent une trace exploitable

**Statut attendu a la fin de la phase**

Back-office utile, productif et suffisamment robuste pour un usage quotidien.

### PHASE 9 - Communication client: email + contact + WhatsApp

**Statut actuel**

Finalisee pour le lancement actuel, sous reserve de config provider email.
Les emails de bienvenue, confirmation commande, statut commande, disponibilite produit, les campagnes admin, le contact et WhatsApp sont relies au code.

**Objectif**

Rendre la relation client simple, professionnelle, visible et rassurante.

**Pourquoi cette phase arrive a ce moment**

Quand les commandes existent vraiment, la communication devient un levier direct de confiance et de support.

**Existant confirme**

- templates email JSX relies au code
- emails de bienvenue, confirmation commande, statut commande et disponibilite produit relies au provider si configure
- footer, page contact et bouton WhatsApp visibles
- campagnes email admin et notifications de retour en stock branchees

**Ce qui manque**

- configuration effective du provider email en production
- gouvernance marketing plus avancee si l equipe veut industrialiser les campagnes

**Ce qu'il faut construire**

- relation client simple et propre
- canal de contact immediat et clair
- separation nette entre messages transactionnels et marketing

**Dependances**

- Phase 1 pour reset password
- Phase 5 pour confirmation commande
- Phase 8 pour certaines actions admin

**Risques**

- melanger messages marketing et transactionnels
- lancer des emails sans clarifier l'opt-in et l'usage
- ajouter un contact sans traitement anti-spam

**Taches detaillees**

- choisir et brancher un provider email adapte
- connecter les templates email aux evenements reels du site
- envoyer un email de confirmation commande
- envoyer un email lie au reset password
- definir le flux de notification de disponibilite produit
- definir le flux d'email promotionnel et sa gouvernance admin
- rendre le contact visible dans la home, le footer, les fiches produit et les etapes critiques si necessaire
- ajouter un bouton WhatsApp clair et coherent avec la marque
- creer une page ou un module de contact simple
- mettre en place les protections minimales anti-spam et de clarté d'usage

**Criteres d'acceptation**

- un email de confirmation est envoye apres une vraie commande
- un email de reset password est envoye dans le flux reel
- un client peut facilement contacter la ferme
- un client peut acceder a WhatsApp facilement si cette option est retenue
- les emails transactionnels et marketing sont clairement distingues
- le point de contact renforce la confiance au lieu de creer de la confusion

**Statut attendu a la fin de la phase**

Communication client professionnelle, visible et utile, renforcee par des emails reels et un contact direct simple.

### PHASE 10 - Finitions commerciales et confiance

**Statut actuel**

Finalisee pour le lancement actuel.
La home, la navigation mobile, les pages livraison et informations legales ainsi que la couche de reassurance ont ete ajoutees.

**Objectif**

Faire du site une boutique plus rassurante, plus coherente et plus vendeuse.

**Pourquoi cette phase arrive a ce moment**

Une fois les flux critiques en place, il faut maximiser la confiance, la perception de qualite et la conversion.

**Existant confirme**

- home commerciale plus rassurante
- navigation mobile et pages livraison / legal en place
- contact et reassurance mieux integres dans la vitrine
- coherence de marque Legend Farm nettement renforcee

**Ce qui manque**

- optimisation conversion plus poussee apres observation des usages reels

**Ce qu'il faut construire**

- couche commerciale et reassurance client
- coherence de marque et de message
- meilleure desirabilite globale du site

**Dependances**

- phases 2 a 9 idealement bien avancees

**Risques**

- faire une belle surcouche sur une logique encore bancale
- multiplier les messages marketing sans clarte utile

**Taches detaillees**

- retravailler la home pour mieux raconter Legend Farm
- structurer une hierarchie visuelle plus forte sur la vitrine
- ajouter des blocs de reassurance: qualite, livraison, contact, disponibilite, service
- clarifier les informations de livraison et de contact sur les pages utiles
- creer les pages legales et utiles necessaires au lancement
- definir la place de la politique de retour ou de reclamation si applicable
- harmoniser le branding et le ton commercial de tout le site
- verifier que les pages produits et checkout renforcent l'envie d'achat

**Criteres d'acceptation**

- la home inspire davantage confiance et envie d'acheter
- les informations de reassurance sont visibles sans etre envahissantes
- les pages utiles et legales necessaires existent
- la marque Legend Farm est plus coherente visuellement et editorialement
- le site parait nettement plus abouti et plus professionnel qu'au depart

**Statut attendu a la fin de la phase**

Boutique plus credible, plus rassurante et plus vendeuse, prete a convaincre de vrais clients.

### PHASE 11 - Qualite, securite, performance, SEO et accessibilite

**Statut actuel**

Finalisee pour le lancement actuel.
Le site dispose d un SEO technique minimal, d une meilleure hygiene anti-abus, de tests utilitaires, de scripts de verification et d une observabilite deja branchee.

**Objectif**

Rendre le site propre pour une vraie mise en production.

**Pourquoi cette phase arrive a ce moment**

La qualite de production doit s'appliquer a un produit deja presque complet, pas a un simple prototype.

**Existant confirme**

- middleware, RLS et Sentry deja presents
- robots, sitemap, metadata et observabilite deja branches
- rate limiting, protections anti-abus et hygiene de formulaires en place
- tests smoke utilitaires et script de readiness disponibles

**Ce qui manque**

- verification mobile et accessibilite plus poussee sur davantage d appareils reels
- rate limit distribue si le contexte production l exige
- analytics metier et tests automatisés plus larges si le produit evolue

**Ce qu'il faut construire**

- socle de production robuste
- hygiene qualite et securite suffisante pour un vrai lancement

**Dependances**

- toutes les phases fonctionnelles majeures doivent etre tres avancees

**Risques**

- remettre la qualite trop tard et decouvrir des regressions majeures
- oublier les controles mobiles et accessibilite
- laisser des flux publics sans protection suffisante

**Taches detaillees**

- revoir les permissions staff et l'acces admin fin
- revoir les policies RLS a la lumiere des vraies mutations ajoutees
- renforcer le rate limit et documenter la config Redis si retenue
- renforcer l'anti-spam des formulaires et flux publics sensibles
- valider le comportement mobile sur les ecrans critiques
- reprendre l'accessibilite des formulaires, boutons, contrastes, messages et navigation clavier
- enrichir le SEO technique: metadata, titres, descriptions, pages utiles, robots, sitemap si retenus
- optimiser la performance image et la perception de rapidite
- verifier l'observabilite Sentry et les remontées d'erreurs utiles
- definir des analytics utiles pour le pilotage metier si necessaire
- ajouter les tests minimaux indispensables sur auth, panier, commande, admin et quelques utilitaires critiques

**Criteres d'acceptation**

- les pages critiques passent une revue securite acceptable
- les flux publics sensibles ont un minimum de protection anti-abus
- les ecrans critiques sont utilisables sur mobile
- les formulaires critiques respectent un niveau d'accessibilite plus solide
- le SEO technique minimal est en place
- des tests minimum existent sur les flux critiques
- l'observabilite remonte les erreurs importantes de production

**Statut attendu a la fin de la phase**

Site propre, securise, observable et beaucoup plus serein pour une vraie production.

### PHASE 12 - Pre-production et mise en service

**Statut actuel**

Finalisee pour le scope du repo, sous reserve des prerequis externes.
Le projet dispose maintenant d une checklist de readiness, d un script de verification locale, d un audit final et d un cadrage clair des prerequis de lancement.

**Objectif**

Verifier que le site est reellement pret a etre utilise, puis organiser une mise en ligne propre.

**Pourquoi cette phase arrive a ce moment**

Un site presque complet n'est pas encore un site pret a lancer. Il faut une validation finale stricte des parcours et des configurations.

**Existant confirme**

- checklist de readiness en place
- script `npm run verify:readiness` en place
- audit final de lancement redige
- projet oriente Vercel avec variables d'environnement locales deja presentes

**Ce qui manque**

- application des prerequis externes sur l infrastructure reelle
- validation finale en environnement de pre-production avec vraies donnees et vrais comptes

**Ce qu'il faut construire**

- pre-production rigoureuse
- plan de mise en service clair
- reduction du risque de lancement

**Dependances**

- toutes les phases precedentes doivent etre suffisamment stables

**Risques**

- lancer le site sans validation de bout en bout
- oublier des variables, des emails ou des droits admin
- ne pas preparer les donnees initiales utiles

**Taches detaillees**

- creer une checklist complete avant mise en ligne
- verifier les variables d'environnement de developpement, preview et production
- verifier les donnees produits de lancement
- verifier les images et les fallbacks
- verifier les parcours auth, panier, checkout, commande et suivi
- verifier le back-office et les permissions staff
- verifier les emails transactionnels et les scenarios d'erreur importants
- verifier les protections de securite et les protections anti-abus
- preparer la surveillance de lancement via Sentry et analytics utiles
- definir un plan de lancement progressif et un plan de repli si necessaire

**Criteres d'acceptation**

- la checklist de pre-production est complete et validee
- les variables d'environnement sont valideses pour la production
- les parcours critiques fonctionnent de bout en bout
- l'admin est capable d'exploiter le site au quotidien
- les emails essentiels sont valides
- les images produits et leur affichage sont valides
- les controles de securite principaux sont valides
- le plan de lancement est pret

**Statut attendu a la fin de la phase**

Projet pret a etre mis en service avec un niveau de risque beaucoup plus controle.

## 7. Detail des taches par phase

### Vue transversale de pilotage

- Phase 0: fiabiliser les details par id, corriger la fiche admin produit, aligner les types, clarifier env et placeholders
- Phase 1: brancher login, register, reset password, logout, validation et redirections
- Phase 2: rendre la vitrine catalogue vendable avec meilleure home, cartes, fiches, recherche, filtres et classement
- Phase 3: mettre en place une vraie gestion des images produits
- Phase 4: construire un panier persistant, editable et fiable
- Phase 5: construire le checkout et la creation reelle de commande
- Phase 6: poser un modele paiement propre et coherent
- Phase 7: rendre l'espace client vraiment utile apres achat
- Phase 8: transformer l'admin en vrai outil d'exploitation
- Phase 9: brancher les emails, le contact et WhatsApp
- Phase 10: renforcer la confiance, la conversion et la desirabilite commerciale
- Phase 11: traiter securite, qualite, mobile, accessibilite, SEO, performance, observabilite et tests
- Phase 12: valider et preparer la mise en service

## 8. Criteres d'acceptation par phase

### Vue transversale de validation

- Phase 0: les details critiques ne dependent plus de listes limitees et les types utiles sont alignes
- Phase 1: un utilisateur peut se connecter, s'inscrire, reinitialiser son mot de passe et se deconnecter depuis l'UI
- Phase 2: un visiteur peut explorer un catalogue convaincant et comprendre rapidement l'offre
- Phase 3: un admin peut gerer les images produits et le front les affiche proprement
- Phase 4: un client peut gerer un panier persistant avec des totaux coherents
- Phase 5: une vraie commande est creee en base depuis le checkout
- Phase 6: les statuts paiement et commande sont coherents et exploitables
- Phase 7: le compte client permet de suivre, comprendre et gerer l'apres-achat
- Phase 8: l'admin peut piloter produits, commandes, promotions et parametres au quotidien
- Phase 9: les emails utiles sont relies au code et le contact client est simple
- Phase 10: le site est plus rassurant, plus vendeur et plus coherent commercialement
- Phase 11: le site atteint un niveau acceptable de securite, SEO, accessibilite, performance et qualite
- Phase 12: la checklist de lancement est validee et le site est pret a etre mis en service

## 9. Dependances entre phases

### Ce qui doit etre fait avant quoi

- la Phase 0 doit preceder les phases metier lourdes
- la Phase 1 doit preceder toute exploitation serieuse de l'espace client et du checkout
- la Phase 4 doit preceder la Phase 5
- la Phase 5 doit preceder la Phase 6
- la Phase 5 doit fortement alimenter la Phase 7
- la Phase 8 depend du socle clarifie en Phase 0 et beneficie des schemas/fonctions deja valides par les phases 3 a 6
- la Phase 11 doit arriver apres les flux critiques, pas avant
- la Phase 12 depend de l'avancement suffisant de toutes les phases critiques et importantes

### Ce qui peut etre fait en parallele

- une partie de la Phase 2 peut avancer pendant la fin de la Phase 1
- la strategie media de la Phase 3 peut etre definie pendant la fin de la Phase 2
- la preparation des templates email de la Phase 9 peut commencer avant l'integration complete des envois
- certains travaux de branding de la Phase 10 peuvent avancer pendant les phases 2 et 3, a condition de ne pas ralentir les flux critiques

### Ce qu'il ne faut surtout pas commencer trop tot

- ne pas investir massivement dans les finitions commerciales tant que auth, panier et commande ne sont pas fiables
- ne pas lancer un admin complexe en ecriture sans permissions et historique minimaux
- ne pas integrer un provider paiement sans modele transactionnel propre
- ne pas faire une campagne email reelle avant d'avoir clarifie les regles transactionnelles et marketing

### Ce qui conditionne la mise en production

- auth UI complete
- panier et checkout reels
- creation de commande fiable
- admin exploitable pour piloter produits et commandes
- medias produits propres
- contact client clair
- revue qualite, securite, mobile et SEO minimale
- checklist de pre-production validee

## 10. Priorisation stricte

### Bloquant

- Phase 0: stabilisation des details par id et clarte technique minimale
- Phase 1: authentification UI complete
- Phase 4: panier fonctionnel et persistant
- Phase 5: checkout et creation de commande
- Phase 8: back-office admin en ecriture minimum exploitable

### Critique

- Phase 3: gestion des medias produits
- Phase 6: modele paiement et statuts transactionnels propres
- Phase 7: compte client complet
- Phase 9: emails transactionnels et contact client
- Phase 11: securite, qualite et mobile

### Important

- Phase 2: catalogue vendeur et credible
- Phase 10: finitions commerciales et confiance
- historique utile des operations admin
- permissions fines par role staff

### Utile

- analytics metier encore plus pousses
- automatisations marketing plus riches
- optimisation editoriale et SEO approfondie

### Bonus

- experiences marketing plus poussees
- segmentation plus fine
- automatisations de relance plus elaborees
- enrichissements non essentiels du compte client

## 11. Erreurs a eviter absolument

- construire trop d'ecrans sans finir les flux critiques
- melanger lecture seule et vraies mutations sans rigueur ni permissions claires
- creer une belle UI sans logique metier fiable
- oublier les details par id et se reposer sur des listes limitees
- laisser l'admin en lecture trop longtemps alors qu'il doit piloter le site
- oublier les images produits alors qu'elles sont centrales pour la confiance et la conversion
- oublier les emails utiles et la communication post-commande
- oublier le contact direct et WhatsApp
- oublier les roles admin et la securite associee
- oublier les criteres d'acceptation de chaque phase
- oublier le mobile et l'accessibilite dans les ecrans critiques
- oublier la coherence entre les parametres admin et l'affichage de la boutique
- commencer les finitions marketing avant de fiabiliser auth, panier et commande

## 12. Vision finale

Le but final n'est pas d'avoir seulement des pages ou un prototype joli.
Le but est de construire un vrai site e-commerce Legend Farm:

- credible
- rassurant
- fluide
- administrable
- vendeur
- propre techniquement

Le site doit pouvoir etre utilise en production avec confiance par de vrais clients et de vrais admins.
Il doit donner envie d'acheter, inspirer le serieux, et rester simple a exploiter au quotidien.
