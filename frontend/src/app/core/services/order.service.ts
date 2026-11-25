import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminStats, Order, OrderStatus, Paginated, RestaurantStats } from '../models/models';

export interface NewOrderPayload {
  restaurant: string;
  articles: { plat: string; quantite: number }[];
  adresseLivraison: string;
  telephone?: string;
  remarque?: string;
  modePaiement: 'livraison' | 'en_ligne';
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/orders`;

  /** Crée la commande ; les prix sont recalculés côté serveur. */
  create(payload: NewOrderPayload): Observable<{ message: string; order: Order }> {
    return this.http.post<{ message: string; order: Order }>(this.base, payload);
  }

  /** Commandes du client connecté, paginées et filtrées par statut. */
  getMyOrders(page = 1, limit = 10, statut?: OrderStatus): Observable<Paginated<Order>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    // Filtre de statut ajouté seulement s'il est fourni.
    if (statut) params = params.set('statut', statut);
    return this.http.get<Paginated<Order>>(`${this.base}/my-orders`, { params });
  }

  /** Commandes reçues par le restaurant du restaurateur connecté. */
  getRestaurantOrders(page = 1, limit = 10, statut?: OrderStatus): Observable<Paginated<Order>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (statut) params = params.set('statut', statut);
    return this.http.get<Paginated<Order>>(`${this.base}/restaurant`, { params });
  }

  /** Détail d'une commande (client, restaurateur ou admin). */
  getOrder(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.base}/${id}`);
  }

  /** Change le statut ; motifRefus attendu pour un refus. */
  updateStatus(id: string, statut: OrderStatus, motifRefus?: string): Observable<{ message: string; order: Order }> {
    return this.http.put<{ message: string; order: Order }>(`${this.base}/${id}/status`, { statut, motifRefus });
  }

  /** Statistiques du restaurant du restaurateur connecté. */
  getRestaurantStats(): Observable<RestaurantStats> {
    return this.http.get<RestaurantStats>(`${this.base}/stats/restaurant`);
  }
}

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/stats`;

  /** Statistiques globales réservées à l'admin. */
  getAdminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.base}/admin`);
  }

  /** Compteurs publics affichés sur la page d'accueil. */
  getPublicStats(): Observable<{ restaurants: number; dishes: number; orders: number }> {
    return this.http.get<{ restaurants: number; dishes: number; orders: number }>(`${this.base}/public`);
  }
}
