import { Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe, KeyValuePipe, LowerCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STEPS,
  Order,
  OrderStatus,
  PaginationMeta,
} from '../../core/models/models';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';

/** Historique des commandes avec filtre, pagination et annulation. */
@Component({
  selector: 'app-my-orders',
  imports: [DatePipe, DecimalPipe, KeyValuePipe, LowerCasePipe, FormsModule, RouterLink],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.css',
})
export class MyOrders {
  private readonly orderService = inject(OrderService);
  private readonly toast = inject(ToastService);
  readonly auth = inject(AuthService);

  readonly orders = signal<Order[]>([]);
  readonly meta = signal<PaginationMeta>({ total: 0, page: 1, limit: 6, pages: 1 });
  readonly loading = signal(true);
  readonly expanded = signal<string | null>(null);
  readonly statusLabels = ORDER_STATUS_LABELS;
  readonly steps = ORDER_STATUS_STEPS;
  statusFilter: OrderStatus | '' = '';

  /** Charge la première page des commandes au démarrage. */
  constructor() {
    this.load();
  }

  /** Charge les commandes de l'utilisateur pour la page demandée. */
  load(page = 1): void {
    this.loading.set(true);
    this.orderService.getMyOrders(page, 6, this.statusFilter || undefined).subscribe({
      next: (res) => {
        this.orders.set(res.data);
        this.meta.set(res.meta);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.message || 'Impossible de charger vos commandes.');
      },
    });
  }

  /** Recharge la première page après changement de filtre de statut. */
  filterChanged(): void {
    this.load(1);
  }

  toggle(orderId: string): void {
    this.expanded.set(this.expanded() === orderId ? null : orderId);
  }

  /** Demande confirmation, annule la commande et recharge la liste. */
  cancelOrder(order: Order): void {
    if (!window.confirm('Voulez-vous vraiment annuler cette commande ?')) return;

    // L'API n'accepte l'annulation que tant que le statut est en_attente.
    this.orderService.updateStatus(order._id, 'annulee').subscribe({
      next: () => {
        this.toast.success('Commande annulée.');
        this.load(this.meta().page);
      },
      error: (err) => this.toast.error(err.message || 'Annulation impossible.'),
    });
  }

  statusClass(statut: OrderStatus): string {
    switch (statut) {
      case 'livree':
        return 'badge-open';
      case 'refusee':
      case 'annulee':
        return 'badge-closed';
      case 'en_attente':
        return 'badge-pending';
      default:
        return 'badge-info';
    }
  }

  /** Indique si une étape du suivi de commande est déjà franchie. */
  isStepDone(order: Order, step: OrderStatus): boolean {
    const current = this.steps.indexOf(order.statut);
    const index = this.steps.indexOf(step);
    return current >= 0 && index <= current;
  }

  itemCount(order: Order): number {
    return order.articles.reduce((sum, item) => sum + item.quantite, 0);
  }

  pages(): number[] {
    return Array.from({ length: this.meta().pages }, (_, index) => index + 1);
  }
}
