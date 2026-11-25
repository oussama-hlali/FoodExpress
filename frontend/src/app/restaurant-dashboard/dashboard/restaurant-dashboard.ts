import { Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ORDER_STATUS_LABELS, RestaurantStats } from '../../core/models/models';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-restaurant-dashboard',
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './restaurant-dashboard.html',
  styleUrl: './restaurant-dashboard.css',
})
export class RestaurantDashboard {
  private readonly orderService = inject(OrderService);
  private readonly toast = inject(ToastService);

  readonly stats = signal<RestaurantStats | null>(null);
  readonly loading = signal(true);
  readonly labels = ORDER_STATUS_LABELS;

  constructor() {
    this.orderService.getRestaurantStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.message || 'Impossible de charger les statistiques.');
      },
    });
  }
}
