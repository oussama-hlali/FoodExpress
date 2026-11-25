import { Injectable, computed, signal } from '@angular/core';
import { Cart, CartItem, Dish, Restaurant } from '../models/models';

const CART_KEY = 'foodexpress_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _cart = signal<Cart>(this.readCart());

  readonly cart = this._cart.asReadonly();
  readonly items = computed(() => this._cart().items);
  readonly count = computed(() => this._cart().items.reduce((sum, item) => sum + item.quantite, 0));
  // computed : le sous-total est arrondi pour éviter les erreurs flottantes.
  readonly sousTotal = computed(() =>
    Math.round(this._cart().items.reduce((sum, item) => sum + item.prixUnitaire * item.quantite, 0) * 100) / 100
  );
  readonly fraisLivraison = computed(() => (this._cart().items.length ? this._cart().fraisLivraison : 0));
  readonly total = computed(() => Math.round((this.sousTotal() + this.fraisLivraison()) * 100) / 100);
  readonly isEmpty = computed(() => this._cart().items.length === 0);

  /** Ajoute un plat. Renvoie false si le panier contient déjà un autre restaurant. */
  add(dish: Dish, restaurant: Restaurant, quantite = 1): boolean {
    const cart = this._cart();
    if (cart.restaurantId && cart.restaurantId !== restaurant._id) {
      return false;
    }

    const items = [...cart.items];
    const existing = items.find((item) => item.plat === dish._id);

    if (existing) {
      existing.quantite += quantite;
    } else {
      items.push({
        plat: dish._id,
        nom: dish.nom,
        prixUnitaire: dish.prix,
        image: dish.image,
        quantite,
      });
    }

    this.persist({
      restaurantId: restaurant._id,
      restaurantNom: restaurant.nom,
      fraisLivraison: restaurant.fraisLivraison,
      items,
    });
    return true;
  }

  /** Remplace le panier par un plat d'un autre restaurant. */
  replaceWith(dish: Dish, restaurant: Restaurant): void {
    this.clear();
    this.add(dish, restaurant);
  }

  increment(platId: string): void {
    this.updateQuantity(platId, 1);
  }

  decrement(platId: string): void {
    this.updateQuantity(platId, -1);
  }

  /** Ajuste la quantité ; un article à zéro est supprimé. */
  updateQuantity(platId: string, delta: number): void {
    const cart = this._cart();
    const items = cart.items
      .map((item) => (item.plat === platId ? { ...item, quantite: item.quantite + delta } : item))
      .filter((item) => item.quantite > 0);

    this.persist(this.withItems(cart, items));
  }

  remove(platId: string): void {
    const cart = this._cart();
    this.persist(this.withItems(cart, cart.items.filter((item) => item.plat !== platId)));
  }

  /** Vide le panier et libère le restaurant. */
  clear(): void {
    this.persist({ restaurantId: null, restaurantNom: '', fraisLivraison: 0, items: [] });
  }

  /** Quantité d'un plat dans le panier (0 si absent). */
  quantityOf(platId: string): number {
    return this._cart().items.find((item) => item.plat === platId)?.quantite ?? 0;
  }

  private withItems(cart: Cart, items: CartItem[]): Cart {
    // Dernier article retiré : on repart d'un panier vierge.
    if (!items.length) {
      return { restaurantId: null, restaurantNom: '', fraisLivraison: 0, items: [] };
    }
    return { ...cart, items };
  }

  private persist(cart: Cart): void {
    this._cart.set(cart);
    // Persistance : le panier survit au rechargement de la page.
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  private readCart(): Cart {
    const empty: Cart = { restaurantId: null, restaurantNom: '', fraisLivraison: 0, items: [] };
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return empty;
    try {
      const parsed = JSON.parse(raw) as Cart;
      if (!Array.isArray(parsed.items)) return empty;
      return parsed;
    } catch {
      // Données corrompues : on repart avec un panier vide.
      return empty;
    }
  }
}
