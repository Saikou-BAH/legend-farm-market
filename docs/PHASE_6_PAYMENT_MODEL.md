# Phase 6 - Modele de paiement Legend Farm Shop

## Objectif

Ce document fixe la strategie de paiement actuellement retenue pour `Legend Farm Shop`.

Le but n est pas de simuler un provider externe absent.
Le but est d avoir un modele transactionnel propre, coherent, exploitable par l equipe et pret pour une integration future si necessaire.

## Perimetre actuellement livre

Confirme par le code :

- une commande creee depuis le checkout stocke `payment_method` et `payment_status` dans `orders`
- une transaction initiale `pending` est creee si la table `payment_transactions` existe
- l historique transactionnel est stocke dans `payment_transactions`
- `orders.payment_status` est recalcule automatiquement depuis les transactions
- un admin staff actif peut enregistrer manuellement :
  - un encaissement
  - un remboursement
  - un echec
  - une annulation transactionnelle
- le detail commande client et admin affiche l etat transactionnel

Fichiers clefs :

- [004_payment_transactions.sql](/home/saikou/legend-farm-market/supabase/migrations/004_payment_transactions.sql)
- [checkout.ts](/home/saikou/legend-farm-market/lib/actions/checkout.ts)
- [admin-order-payments.ts](/home/saikou/legend-farm-market/lib/actions/admin-order-payments.ts)
- [order-payment-manager.tsx](/home/saikou/legend-farm-market/components/admin/order-payment-manager.tsx)
- [order-payment-summary.tsx](/home/saikou/legend-farm-market/components/shop/order-payment-summary.tsx)

## Strategie de lancement retenue

Strategie actuellement retenue pour le lancement :

- pas de provider de paiement temps reel branche pour l instant
- suivi transactionnel interne dans la base
- validation et mise a jour manuelles par le staff quand c est necessaire
- modele propre et compatible avec une future integration provider

Cela signifie :

- le site peut accepter une commande sans pretendre qu un paiement externe a ete capture automatiquement
- l equipe peut enregistrer les mouvements reels de paiement dans le back-office
- le client voit un statut de paiement coherent

## Moyens de paiement

### Supportes dans le checkout client

- `cash_on_delivery`
- `orange_money`
- `mtn_money`
- `bank_transfer`

### Supportes dans le modele transactionnel interne

- `cash_on_delivery`
- `orange_money`
- `mtn_money`
- `bank_transfer`
- `account_credit`
- `loyalty_points`

Les deux derniers sont conserves dans le modele pour la suite, meme si leur usage complet cote checkout n est pas encore finalise.

## Regles de statut paiement

Le statut `orders.payment_status` est derive de l historique `payment_transactions`.

### Transactions prises en compte

- seules les transactions `succeeded` impactent le net encaisse
- les transactions `failed`, `cancelled` ou `pending` n augmentent pas le montant encaisse
- les `charge` augmentent le net encaisse
- les `refund` diminuent le net encaisse

### Regles de calcul

- `pending` : aucun encaissement reussi net
- `partial` : montant net encaisse strictement positif mais inferieur au total de commande
- `paid` : montant net encaisse superieur ou egal au total de commande
- `refunded` : apres au moins un encaissement reussi, le net encaisse revient a zero a cause des remboursements reussis

## Regles admin importantes

Le back-office applique les garde-fous suivants :

- impossible d enregistrer un montant inferieur ou egal a zero
- impossible d enregistrer un encaissement reussi qui depasse le total de commande
- impossible d enregistrer un remboursement reussi si aucun montant net n a deja ete encaisse
- impossible d enregistrer un remboursement reussi superieur au net encaisse
- impossible d enregistrer un encaissement reussi sur une commande annulee ou retournee

## Comportement des cas principaux

### Cas 1 - Commande creee, paiement non encore traite

- la commande est creee avec `payment_status = pending`
- une transaction initiale `charge / pending` peut etre ajoutee
- le client voit que la commande existe mais que le paiement est en attente

### Cas 2 - Paiement partiel

- le staff enregistre une transaction `charge / succeeded` inferieure au total
- `orders.payment_status` devient `partial`

### Cas 3 - Paiement complet

- le staff enregistre une ou plusieurs transactions `charge / succeeded`
- si le net encaisse atteint le total commande, `orders.payment_status` devient `paid`

### Cas 4 - Echec ou annulation de tentative

- le staff enregistre `charge / failed` ou `charge / cancelled`
- cela garde une trace operationnelle
- cela ne modifie pas le montant net encaisse

### Cas 5 - Remboursement

- le staff enregistre une transaction `refund`
- si elle est `succeeded`, elle diminue le net encaisse
- si le net encaisse retombe a zero apres remboursement, `orders.payment_status` devient `refunded`

## Ce que ce modele ne fait pas encore

- debiter automatiquement une carte ou un wallet
- recevoir des webhooks provider
- verifier automatiquement une reference mobile money
- declencher automatiquement un changement de statut commande depuis un paiement externe
- envoyer automatiquement un email transactionnel de paiement

## Pre-requis techniques

La migration suivante doit etre appliquee sur la base distante :

- [004_payment_transactions.sql](/home/saikou/legend-farm-market/supabase/migrations/004_payment_transactions.sql)

Sans cette migration :

- les commandes peuvent encore etre creees
- mais l historique transactionnel detaille ne sera pas disponible
- la phase 6 n est alors pas completement exploitable

## Recommandation de pilotage

Pour la suite du projet :

1. garder ce modele comme source de verite interne
2. ne brancher un provider externe qu en s appuyant sur `payment_transactions`
3. faire en sorte qu un provider cree ou mette a jour des transactions, au lieu de contourner ce modele

## Etat de phase

Phase 6 est considerée finalisable pour un lancement sans provider externe, a condition que :

- la migration soit appliquee
- l equipe admin utilise l historique transactionnel comme source de verite paiement
- la suite du projet respecte ce modele au lieu de le contourner
