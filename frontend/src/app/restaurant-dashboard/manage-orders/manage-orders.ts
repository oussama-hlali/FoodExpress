import { Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ORDER_STATUS_LABELS, Order, OrderStatus, PaginationMeta } from '../../core/models/models';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-manage-orders',
  imports: [DatePipe, DecimalPipe, KeyValuePipe, FormsModule],
  templateUrl: './manage-orders.html',
  styleUrl: './manage-orders.css',
})
export class ManageOrders {
  private readonly orderService = inject(OrderService);
  private readonly toast = inject(ToastService);

  readonly orders = signal<Order[]>([]);
  readonly meta = signal<PaginationMeta>({ total: 0, page: 1, limit: 10, pages: 1 });
  readonly loading = signal(true);
  readonly expanded = signal<string | null>(null);
  readonly labels = ORDER_STATUS_LABELS;
  statusFilter: OrderStatus | '' = '';

  constructor() {
    this.load();
  }

  load(page = 1): void {
    this.loading.set(true);
    this.orderService.getRestaurantOrders(page, 10, this.statusFilter || undefined).subscribe({
      next: (res) => {
        this.orders.set(res.data);
        this.meta.set(res.meta);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.message || 'Impossible de charger les commandes.');
      },
    });
  }

  filterChanged(): void {
    this.load(1);
  }

  toggle(orderId: string): void {
    this.expanded.set(this.expanded() === orderId ? null : orderId);
  }

  nextAction(order: Order): { label: string; statut: OrderStatus; icon: string } | null {
    switch (order.statut) {
      case 'acceptee':
        return { label: 'En préparation', statut: 'en_preparation', icon: 'bi-fire' };
      case 'en_preparation':
        return { label: 'Commande prête', statut: 'prete', icon: 'bi-check2' };
      case 'prete':
        return { label: 'Envoyer en livraison', statut: 'en_livraison', icon: 'bi-scooter' };
      case 'en_livraison':
        return { label: 'Marquer livrée', statut: 'livree', icon: 'bi-bag-check' };
      default:
        return null;
    }
  }

  accept(order: Order): void {
    this.updateStatus(order, 'acceptee', 'Commande acceptée.');
  }

  refuse(order: Order): void {
    const motif = window.prompt('Motif du refus (optionnel) :');
    if (motif === null) return;
    this.updateStatus(order, 'refusee', 'Commande refusée.', motif || undefined);
  }

  advance(order: Order): void {
    const action = this.nextAction(order);
    if (!action) return;
    this.updateStatus(order, action.statut, 'Statut mis à jour.');
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

  pages(): number[] {
    return Array.from({ length: this.meta().pages }, (_, index) => index + 1);
  }

  private updateStatus(order: Order, statut: OrderStatus, message: string, motif?: string): void {
    this.orderService.updateStatus(order._id, statut, motif).subscribe({
      next: () => {
        this.toast.success(message);
        this.load(this.meta().page);
      },
      error: (err) => this.toast.error(err.message || 'Mise à jour impossible.'),
    });
  }
}
