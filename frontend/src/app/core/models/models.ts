export type Role = 'client' | 'restaurateur' | 'admin';

export interface User {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: Role;
  isActive: boolean;
  createdAt?: string;
}

/** Réponse de login/register : token JWT + utilisateur. */
export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

/** Validation d'une fiche restaurant par l'administrateur. */
export type RestaurantStatus = 'en_attente' | 'valide' | 'suspendu';

export interface Restaurant {
  _id: string;
  nom: string;
  description: string;
  adresse: string;
  typeCuisine: string;
  image: string;
  fraisLivraison: number;
  horaires: string;
  isOpen: boolean;
  statut: RestaurantStatus;
  owner: User | string;
  createdAt?: string;
}

export interface Category {
  _id: string;
  nom: string;
  description?: string;
  type: 'plat' | 'cuisine';
  restaurant?: string | null;
}

export interface Dish {
  _id: string;
  nom: string;
  description: string;
  prix: number;
  image: string;
  disponible: boolean;
  categorie: Category | string;
  restaurant: string;
  createdAt?: string;
}

export interface RestaurantDetails {
  restaurant: Restaurant;
  categories: Category[];
  dishes: Dish[];
}

/** Cycle de vie d'une commande, du paiement à la clôture. */
export type OrderStatus =
  | 'en_attente'
  | 'acceptee'
  | 'en_preparation'
  | 'prete'
  | 'en_livraison'
  | 'livree'
  | 'refusee'
  | 'annulee';

export interface OrderItem {
  plat: string;
  nom: string;
  quantite: number;
  prixUnitaire: number;
  image?: string;
}

export interface Order {
  _id: string;
  client: User;
  restaurant: Restaurant;
  articles: OrderItem[];
  adresseLivraison: string;
  telephone: string;
  sousTotal: number;
  fraisLivraison: number;
  total: number;
  modePaiement: 'livraison' | 'en_ligne';
  statut: OrderStatus;
  remarque?: string;
  motifRefus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Enveloppe d'une liste paginée : données + métadonnées. */
export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface CartItem {
  plat: string;
  nom: string;
  prixUnitaire: number;
  image: string;
  quantite: number;
}

/** Panier local : un seul restaurant à la fois. */
export interface Cart {
  restaurantId: string | null;
  restaurantNom: string;
  fraisLivraison: number;
  items: CartItem[];
}

export interface RestaurantStats {
  totalOrders: number;
  pendingOrders: number;
  acceptedOrders: number;
  deliveredOrders: number;
  revenue: number;
  topDishes: { _id: string; quantite: number; revenu: number }[];
  recentOrders: Order[];
}

export interface AdminStats {
  clients: number;
  restaurateurs: number;
  restaurants: number;
  pendingRestaurants: number;
  orders: number;
  revenue: number;
  ordersByStatus: Record<string, number>;
  recentOrders: Order[];
}

/** Libellés français des statuts affichés dans l'UI. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  en_attente: 'En attente',
  acceptee: 'Acceptée',
  en_preparation: 'En préparation',
  prete: 'Prête',
  en_livraison: 'En livraison',
  livree: 'Livrée',
  refusee: 'Refusée',
  annulee: 'Annulée',
};

/** Étapes de la barre de progression (hors refus et annulation). */
export const ORDER_STATUS_STEPS: OrderStatus[] = [
  'en_attente',
  'acceptee',
  'en_preparation',
  'prete',
  'en_livraison',
  'livree',
];
