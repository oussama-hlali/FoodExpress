import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Pages publiques chargées à la demande
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
    title: 'FoodExpress — Commandez vos repas en ligne',
  },
  {
    path: 'restaurants',
    loadComponent: () => import('./pages/restaurants/restaurants').then((m) => m.Restaurants),
    title: 'Restaurants — FoodExpress',
  },
  {
    path: 'restaurants/:id',
    loadComponent: () =>
      import('./pages/restaurant-details/restaurant-details').then((m) => m.RestaurantDetailsPage),
    title: 'Menu — FoodExpress',
  },
  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart').then((m) => m.CartPage),
    title: 'Mon panier — FoodExpress',
  },
  // Commande réservée aux clients connectés
  {
    path: 'checkout',
    canActivate: [authGuard, roleGuard('client')],
    loadComponent: () => import('./pages/checkout/checkout').then((m) => m.Checkout),
    title: 'Confirmation de commande — FoodExpress',
  },
  // Mes commandes : client connecté
  {
    path: 'my-orders',
    canActivate: [authGuard, roleGuard('client')],
    loadComponent: () => import('./pages/my-orders/my-orders').then((m) => m.MyOrders),
    title: 'Mes commandes — FoodExpress',
  },
  // Profil : simple connexion requise
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile').then((m) => m.Profile),
    title: 'Mon profil — FoodExpress',
  },
  // Login et register : invités uniquement
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
    title: 'Connexion — FoodExpress',
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register/register').then((m) => m.Register),
    title: 'Créer un compte — FoodExpress',
  },
  // Espace restaurateur chargé à la demande
  {
    path: 'restaurant',
    canActivate: [authGuard, roleGuard('restaurateur')],
    loadComponent: () =>
      import('./restaurant-dashboard/layout/restaurant-layout').then((m) => m.RestaurantLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./restaurant-dashboard/dashboard/restaurant-dashboard').then((m) => m.RestaurantDashboard),
        title: 'Tableau de bord — FoodExpress',
      },
      {
        path: 'dishes',
        loadComponent: () =>
          import('./restaurant-dashboard/manage-dishes/manage-dishes').then((m) => m.ManageDishes),
        title: 'Gestion du menu — FoodExpress',
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./restaurant-dashboard/manage-orders/manage-orders').then((m) => m.ManageOrders),
        title: 'Commandes reçues — FoodExpress',
      },
    ],
  },
  // Espace admin chargé à la demande
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('admin')],
    loadComponent: () => import('./admin-dashboard/layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'statistics' },
      {
        path: 'statistics',
        loadComponent: () =>
          import('./admin-dashboard/statistics/statistics').then((m) => m.Statistics),
        title: 'Statistiques — Administration FoodExpress',
      },
      {
        path: 'users',
        loadComponent: () => import('./admin-dashboard/users/users').then((m) => m.Users),
        title: 'Utilisateurs — Administration FoodExpress',
      },
      {
        path: 'restaurants',
        loadComponent: () =>
          import('./admin-dashboard/restaurants/restaurants-admin').then((m) => m.RestaurantsAdmin),
        title: 'Restaurants — Administration FoodExpress',
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./admin-dashboard/categories/categories').then((m) => m.Categories),
        title: 'Catégories — Administration FoodExpress',
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound),
    title: 'Page introuvable — FoodExpress',
  },
];
