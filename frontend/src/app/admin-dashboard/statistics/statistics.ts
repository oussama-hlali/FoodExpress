import { Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminStats, ORDER_STATUS_LABELS } from '../../core/models/models';
import { StatsService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-statistics',
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './statistics.html',
  styleUrl: './statistics.css',
})
export class Statistics {
  private readonly statsService = inject(StatsService);
  private readonly toast = inject(ToastService);

  readonly stats = signal<AdminStats | null>(null);
  readonly loading = signal(true);
  readonly labels = ORDER_STATUS_LABELS;

  constructor() {
    this.statsService.getAdminStats().subscribe({
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

  statuses(): { statut: string; count: number }[] {
    const data = this.stats();
    if (!data) return [];
    return Object.entries(data.ordersByStatus).map(([statut, count]) => ({ statut, count }));
  }

  label(statut: string): string {
    return this.labels[statut as keyof typeof this.labels] ?? statut;
  }

  percent(statut: string): number {
    const total = this.stats()?.orders || 0;
    const row = this.statuses().find((item) => item.statut === statut);
    return total && row ? Math.round((row.count / total) * 100) : 0;
  }
}
