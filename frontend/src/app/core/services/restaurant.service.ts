import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, Dish, Paginated, Restaurant, RestaurantDetails, RestaurantStatus } from '../models/models';

export interface RestaurantFilters {
  q?: string;
  typeCuisine?: string;
  open?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
  statut?: string;
}

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/restaurants`;

  /** Liste paginée des restaurants, avec recherche et filtres. */
  getRestaurants(filters: RestaurantFilters = {}): Observable<Paginated<Restaurant>> {
    let params = new HttpParams();
    // Les filtres vides ne sont pas envoyés à l'API.
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<Paginated<Restaurant>>(this.base, { params });
  }

  /** Fiche complète : restaurant, catégories et plats. */
  getRestaurant(id: string): Observable<RestaurantDetails> {
    return this.http.get<RestaurantDetails>(`${this.base}/${id}`);
  }

  /** Restaurants appartenant au restaurateur connecté. */
  getMine(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(`${this.base}/mine`);
  }

  /** Crée une fiche en attente de validation admin. */
  create(payload: Partial<Restaurant>): Observable<{ message: string; restaurant: Restaurant }> {
    return this.http.post<{ message: string; restaurant: Restaurant }>(this.base, payload);
  }

  /** Met à jour la fiche (propriétaire ou admin). */
  update(id: string, payload: Partial<Restaurant>): Observable<{ message: string; restaurant: Restaurant }> {
    return this.http.put<{ message: string; restaurant: Restaurant }>(`${this.base}/${id}`, payload);
  }

  /** Valide ou suspend un restaurant (admin uniquement). */
  updateStatus(id: string, statut: RestaurantStatus): Observable<{ message: string; restaurant: Restaurant }> {
    return this.http.put<{ message: string; restaurant: Restaurant }>(`${this.base}/${id}/status`, { statut });
  }

  /** Supprime un restaurant (restaurateur ou admin). */
  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/categories`;

  /** Catégories globales de cuisine (Pizza, Tunisien...). */
  getCuisines(): Observable<Category[]> {
    return this.http.get<Category[]>(this.base, { params: new HttpParams().set('type', 'cuisine') });
  }

  /** Catégories du menu d'un restaurant (Entrées, Pizzas...). */
  getByRestaurant(restaurantId: string): Observable<Category[]> {
    return this.http.get<Category[]>(this.base, { params: new HttpParams().set('restaurant', restaurantId) });
  }

  /** Crée une catégorie de menu ou de cuisine. */
  create(payload: { nom: string; description?: string; type?: 'plat' | 'cuisine'; restaurant?: string }): Observable<{
    message: string;
    category: Category;
  }> {
    return this.http.post<{ message: string; category: Category }>(this.base, payload);
  }

  /** Modifie une catégorie (restaurateur ou admin). */
  update(id: string, payload: { nom?: string; description?: string }): Observable<{ message: string; category: Category }> {
    return this.http.put<{ message: string; category: Category }>(`${this.base}/${id}`, payload);
  }

  /** Supprime une catégorie (restaurateur ou admin). */
  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class DishService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/dishes`;

  /** Plats filtrés par restaurant, catégorie ou recherche. */
  getDishes(filters: { restaurant?: string; categorie?: string; q?: string; disponible?: boolean } = {}): Observable<
    Paginated<Dish>
  > {
    // Limite large pour récupérer tout le menu d'un coup.
    let params = new HttpParams().set('limit', '100');
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    });
    return this.http.get<Paginated<Dish>>(this.base, { params });
  }

  /** Ajoute un plat au menu (restaurateur ou admin). */
  create(payload: Partial<Dish>): Observable<{ message: string; dish: Dish }> {
    return this.http.post<{ message: string; dish: Dish }>(this.base, payload);
  }

  /** Modifie un plat du menu (restaurateur ou admin). */
  update(id: string, payload: Partial<Dish>): Observable<{ message: string; dish: Dish }> {
    return this.http.put<{ message: string; dish: Dish }>(`${this.base}/${id}`, payload);
  }

  /** Inverse le flag disponible du plat. */
  toggleAvailability(id: string): Observable<{ message: string; dish: Dish }> {
    return this.http.put<{ message: string; dish: Dish }>(`${this.base}/${id}/availability`, {});
  }

  /** Retire un plat du menu (restaurateur ou admin). */
  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`);
  }
}
