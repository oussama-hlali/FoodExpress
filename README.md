# FoodExpress — Plateforme de commande et de livraison de repas

Application **MEAN Stack** (MongoDB, Express.js, Angular, Node.js) permettant aux clients de
découvrir des restaurants, consulter leurs menus, commander et suivre leurs commandes, avec un
espace dédié aux restaurateurs et un espace d'administration.

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Installation](#installation)
- [Comptes de démonstration](#comptes-de-démonstration)
- [API REST](#api-rest)
- [Règles de gestion](#règles-de-gestion)

## Fonctionnalités

### Client
- Inscription, connexion JWT, profil (nom, prénom, téléphone), changement de mot de passe.
- Accueil avec bannière, recherche, catégories de cuisine et restaurants populaires.
- Liste des restaurants : recherche, filtre par cuisine, restaurants ouverts, tri, pagination.
- Menu d'un restaurant : catégories, description, prix, disponibilité.
- Panier persistant (localStorage) limité à un restaurant, quantités, sous-total, livraison, total.
- Commande : adresse, téléphone, remarque, paiement à la livraison ou en ligne.
- Historique et suivi de commande (cycle de vie complet), annulation tant que la commande est en attente.

### Restaurateur
- Tableau de bord : commandes totales / en attente / en cours, chiffre d'affaires, plats les plus commandés.
- Gestion du menu : catégories, ajout / modification / suppression de plats, prix, disponibilité.
- Gestion des commandes : accepter, refuser (avec motif), faire évoluer le statut.

### Administrateur
- Statistiques globales : clients, restaurants, commandes, chiffre d'affaires, répartition par statut.
- Utilisateurs : recherche, filtre par rôle, activation / désactivation, changement de rôle.
- Restaurants : ajout, modification, suppression, validation / suspension, affectation à un restaurateur.
- Catégories de cuisine : ajout, modification, suppression.

## Architecture

```
foodexpress/
├── backend/
│   ├── config/database.js
│   ├── models/            User, Restaurant, Category, Dish, Order
│   ├── controllers/       auth, user, restaurant, category, dish, order, stats
│   ├── routes/            authRoutes, userRoutes, restaurantRoutes, categoryRoutes,
│   │                      dishRoutes, orderRoutes, statsRoutes
│   ├── middleware/        authMiddleware (JWT), roleMiddleware, errorMiddleware
│   ├── utils/             asyncHandler, query (pagination)
│   ├── seed.js            données de démonstration
│   ├── server.js
│   └── .env.example
├── frontend/
│   └── src/app/
│       ├── core/
│       │   ├── services/       auth, cart, restaurant, order, user, toast
│       │   ├── guards/         authGuard, roleGuard, guestGuard
│       │   ├── interceptors/   jwtInterceptor, errorInterceptor
│       │   └── models/         types partagés
│       ├── shared/             navbar, footer, toast, restaurant-card
│       ├── pages/              home, restaurants, restaurant-details, cart, checkout,
│       │                       my-orders, login, register, profile, not-found
│       ├── restaurant-dashboard/   dashboard, manage-dishes, manage-orders, layout
│       ├── admin-dashboard/        statistics, users, restaurants, categories, layout
│       └── app.routes.ts
└── postman/                  collection de tests de l'API
```

## Installation

### Prérequis
- Node.js 20+
- MongoDB en local (`mongodb://127.0.0.1:27017`)

### 1. Base de données et API

```bash
cd backend
npm install
npm run seed     # crée la base foodexpress et les données de démonstration
npm run dev      # API sur http://localhost:5000
```

Le fichier `.env` contient :

```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/foodexpress
JWT_SECRET=...
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:4200
```

### 2. Interface Angular

```bash
cd frontend
npm install
npm start        # http://localhost:4200
```

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Administrateur | `admin@foodexpress.tn` | `Admin1234` |
| Restaurateur | `resto@foodexpress.tn` | `Resto1234` |
| Restaurateur | `resto2@foodexpress.tn` | `Resto1234` |
| Client | `client@foodexpress.tn` | `Client1234` |

## API REST

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Inscription (rôle client) |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/auth/me` | Profil courant |
| PUT | `/api/auth/profile` | Modifier le profil |
| PUT | `/api/auth/password` | Changer le mot de passe |
| GET | `/api/restaurants` | Liste des restaurants (filtres `q`, `typeCuisine`, `open`, `sort`, `page`) |
| GET | `/api/restaurants/:id` | Détails + menu |
| GET | `/api/restaurants/mine` | Restaurants du restaurateur |
| POST | `/api/restaurants` | Créer un restaurant |
| PUT | `/api/restaurants/:id` | Modifier un restaurant |
| PUT | `/api/restaurants/:id/status` | Valider / suspendre (admin) |
| DELETE | `/api/restaurants/:id` | Supprimer un restaurant |
| GET | `/api/categories` | Catégories (`type=cuisine` ou `restaurant=ID`) |
| POST/PUT/DELETE | `/api/categories/:id?` | Gestion des catégories |
| GET | `/api/dishes` | Liste des plats (`restaurant`, `categorie`, `q`, `disponible`) |
| POST | `/api/dishes` | Ajouter un plat |
| PUT | `/api/dishes/:id` | Modifier un plat |
| PUT | `/api/dishes/:id/availability` | Basculer la disponibilité |
| DELETE | `/api/dishes/:id` | Supprimer un plat |
| POST | `/api/orders` | Passer une commande (total calculé serveur) |
| GET | `/api/orders/my-orders` | Commandes du client |
| GET | `/api/orders/restaurant` | Commandes du restaurateur |
| GET | `/api/orders/:id` | Détail d'une commande |
| PUT | `/api/orders/:id/status` | Modifier le statut |
| GET | `/api/orders/stats/restaurant` | Statistiques restaurateur |
| GET | `/api/users` | Liste des utilisateurs (admin) |
| PUT | `/api/users/:id/status` | Activer / désactiver un compte |
| PUT | `/api/users/:id/role` | Changer le rôle |
| GET | `/api/stats/admin` | Statistiques globales |
| GET | `/api/stats/public` | Chiffres de la page d'accueil |

La collection Postman se trouve dans `postman/FoodExpress.postman_collection.json`
(variable `baseUrl` = `http://localhost:5000/api`).

## Cycle de vie d'une commande

```
en_attente → acceptee → en_preparation → prete → en_livraison → livree
     ↘ refusee
     ↘ annulee (client, uniquement en attente)
```

Une commande livrée, refusée ou annulée ne peut plus être modifiée.

## Règles de gestion appliquées

1. Email unique.
2. Commande réservée aux utilisateurs authentifiés (rôle client).
3. Seuls les plats disponibles d'un restaurant validé peuvent être commandés.
4. Commande avec au moins un article, quantités entières ≥ 1.
5. Prix, noms et total figés et recalculés côté serveur.
6. Un restaurateur ne gère que ses restaurants et leurs commandes.
7. Transitions de statut contrôlées ; commande livrée non modifiable.
8. Compte désactivé = connexion et requêtes refusées.
9. Mots de passe hachés avec bcrypt (10 rounds).
10. Autorisations vérifiées côté serveur pour chaque route protégée.
