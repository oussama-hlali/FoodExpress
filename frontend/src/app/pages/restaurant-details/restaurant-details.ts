import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Dish, RestaurantDetails } from '../../core/models/models';
import { RestaurantService } from '../../core/services/restaurant.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';

/** Fiche restaurant : menu filtrable et ajout des plats au panier. */
@Component({
  selector: 'app-restaurant-details',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './restaurant-details.html',
  styleUrl: './restaurant-details.css',
})
export class RestaurantDetailsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly restaurantService = inject(RestaurantService);
  readonly cart = inject(CartService);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly details = signal<RestaurantDetails | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly activeCategory = signal('all');

  /** Plats affichés selon la catégorie active (signal calculé). */
  readonly visibleDishes = computed(() => {
    const data = this.details();
    if (!data) return [];
    const category = this.activeCategory();
    if (category === 'all') return data.dishes;
    return data.dishes.filter((dish) => this.categoryId(dish) === category);
  });

  /** Charge le restaurant identifié par l'URL. */
  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) this.load(id);
    });
  }

  /** Charge le détail du restaurant et son menu. */
  load(id: string): void {
    this.loading.set(true);
    this.error.set('');
    this.restaurantService.getRestaurant(id).subscribe({
      next: (details) => {
        this.details.set(details);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message || 'Restaurant introuvable.');
        this.loading.set(false);
      },
    });
  }

  categoryId(dish: Dish): string {
    return typeof dish.categorie === 'string' ? dish.categorie : dish.categorie?._id ?? '';
  }

  categoryName(dish: Dish): string {
    const categories = this.details()?.categories ?? [];
    const id = this.categoryId(dish);
    return categories.find((category) => category._id === id)?.nom ?? 'Autres';
  }

  countForCategory(categoryId: string): number {
    return (this.details()?.dishes ?? []).filter((dish) => this.categoryId(dish) === categoryId).length;
  }

  /** Ajoute un plat au panier et informe l'utilisateur par toast. */
  addToCart(dish: Dish): void {
    const data = this.details();
    if (!data) return;

    // Seuls les comptes clients peuvent commander.
    if (this.auth.isLoggedIn() && this.auth.role() !== 'client') {
      this.toast.info('Seuls les comptes clients peuvent commander.');
      return;
    }
    if (!dish.disponible) {
      this.toast.error('Ce plat n’est pas disponible pour le moment.');
      return;
    }

    // Un panier ne peut contenir que des plats d'un seul restaurant.
    const currentRestaurant = this.cart.cart().restaurantId;
    const conflict = !!currentRestaurant && currentRestaurant !== data.restaurant._id;

    if (conflict) {
      const confirmed = window.confirm(
        `Votre panier contient déjà des plats de « ${this.cart.cart().restaurantNom} ». Voulez-vous le vider et ajouter ce plat ?`
      );
      if (!confirmed) return;
      this.cart.replaceWith(dish, data.restaurant);
    } else if (!this.cart.add(dish, data.restaurant)) {
      return;
    }

    this.toast.success(`${dish.nom} ajouté au panier.`);
  }

  /** Redirige vers le panier, ou vers login pour un invité. */
  goToCheckout(): void {
    if (!this.auth.isLoggedIn()) {
      // On mémorise la destination dans ?redirect pour revenir après connexion.
      this.router.navigate(['/login'], { queryParams: { redirect: '/cart' } });
      return;
    }
    this.router.navigate(['/cart']);
  }
}
