import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Category, PaginationMeta, Restaurant } from '../../core/models/models';
import { CategoryService, RestaurantService } from '../../core/services/restaurant.service';
import { RestaurantCard } from '../../shared/restaurant-card/restaurant-card';

/** Liste des restaurants avec recherche, filtres et pagination. */
@Component({
  selector: 'app-restaurants',
  imports: [FormsModule, RouterLink, RestaurantCard],
  templateUrl: './restaurants.html',
  styleUrl: './restaurants.css',
})
export class Restaurants {
  private readonly restaurantService = inject(RestaurantService);
  private readonly categoryService = inject(CategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly restaurants = signal<Restaurant[]>([]);
  readonly cuisines = signal<Category[]>([]);
  readonly meta = signal<PaginationMeta>({ total: 0, page: 1, limit: 9, pages: 1 });
  readonly loading = signal(true);

  q = '';
  typeCuisine = '';
  openOnly = false;
  sort = 'nom_asc';

  /** Synchronise les filtres avec l'URL puis charge la page demandée. */
  constructor() {
    this.categoryService.getCuisines().subscribe({ next: (c) => this.cuisines.set(c), error: () => undefined });

    this.route.queryParamMap.subscribe((params) => {
      this.q = params.get('q') ?? '';
      this.typeCuisine = params.get('typeCuisine') ?? '';
      this.openOnly = params.get('open') === 'true';
      this.sort = params.get('sort') ?? 'nom_asc';
      this.load(params.get('page') ? Number(params.get('page')) : 1);
    });
  }

  /** Charge les restaurants de la page courante avec les filtres actifs. */
  load(page = 1): void {
    this.loading.set(true);
    this.restaurantService
      .getRestaurants({
        q: this.q,
        typeCuisine: this.typeCuisine,
        open: this.openOnly ? true : undefined,
        sort: this.sort,
        page,
        limit: 9,
      })
      .subscribe({
        next: (res) => {
          this.restaurants.set(res.data);
          this.meta.set(res.meta);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  /** Reporte les filtres dans l'URL pour rendre la recherche partageable. */
  applyFilters(): void {
    this.router.navigate(['/restaurants'], {
      queryParams: {
        q: this.q || null,
        typeCuisine: this.typeCuisine || null,
        open: this.openOnly ? 'true' : null,
        sort: this.sort,
      },
    });
  }

  /** Réinitialise les filtres et revient à la première page. */
  resetFilters(): void {
    this.q = '';
    this.typeCuisine = '';
    this.openOnly = false;
    this.sort = 'nom_asc';
    this.router.navigate(['/restaurants']);
  }

  /** Navigue vers une page de résultats, en conservant les filtres. */
  goToPage(page: number): void {
    // Ignore les pages hors des limites de la pagination.
    if (page < 1 || page > this.meta().pages) return;
    this.router.navigate(['/restaurants'], {
      queryParams: {
        q: this.q || null,
        typeCuisine: this.typeCuisine || null,
        open: this.openOnly ? 'true' : null,
        sort: this.sort,
        page: page > 1 ? page : null,
      },
    });
  }

  pages(): number[] {
    return Array.from({ length: this.meta().pages }, (_, index) => index + 1);
  }
}
