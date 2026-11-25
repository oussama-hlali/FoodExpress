import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Category, Restaurant } from '../../core/models/models';
import { CategoryService, RestaurantService } from '../../core/services/restaurant.service';
import { StatsService } from '../../core/services/order.service';
import { RestaurantCard } from '../../shared/restaurant-card/restaurant-card';

const CUISINE_EMOJI: Record<string, string> = {
  Pizza: '🍕',
  Tunisien: '🍲',
  'Fast-food': '🍔',
  Italien: '🍝',
  Sain: '🥗',
  Desserts: '🍰',
  Boissons: '🥤',
  Oriental: '🥘',
};

/** Page d'accueil : cuisines, restaurants populaires et statistiques publiques. */
@Component({
  selector: 'app-home',
  imports: [FormsModule, RouterLink, RestaurantCard],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly restaurantService = inject(RestaurantService);
  private readonly categoryService = inject(CategoryService);
  private readonly statsService = inject(StatsService);
  private readonly router = inject(Router);

  readonly cuisines = signal<Category[]>([]);
  readonly restaurants = signal<Restaurant[]>([]);
  readonly stats = signal({ restaurants: 0, dishes: 0, orders: 0 });
  readonly loading = signal(true);
  search = '';

  /** Charge cuisines, restaurants et statistiques au démarrage. */
  constructor() {
    this.categoryService.getCuisines().subscribe({
      next: (cuisines) => this.cuisines.set(cuisines),
      error: () => this.cuisines.set([]),
    });

    this.restaurantService.getRestaurants({ limit: 6, sort: 'nom_asc' }).subscribe({
      next: (res) => {
        this.restaurants.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.statsService.getPublicStats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => undefined,
    });
  }

  emojiFor(nom: string): string {
    return CUISINE_EMOJI[nom] ?? '🍽️';
  }

  /** Transmet la recherche à la page restaurants via un query param. */
  searchRestaurants(): void {
    this.router.navigate(['/restaurants'], {
      queryParams: this.search.trim() ? { q: this.search.trim() } : {},
    });
  }

  /** Ouvre la liste des restaurants filtrée par type de cuisine. */
  filterByCuisine(cuisine: string): void {
    this.router.navigate(['/restaurants'], { queryParams: { typeCuisine: cuisine } });
  }
}
