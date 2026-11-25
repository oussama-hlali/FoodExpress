import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginationMeta, Role, User } from '../../core/models/models';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-users',
  imports: [FormsModule, DatePipe],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users {
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);

  readonly users = signal<User[]>([]);
  readonly meta = signal<PaginationMeta>({ total: 0, page: 1, limit: 20, pages: 1 });
  readonly loading = signal(true);
  q = '';
  role = '';

  constructor() {
    this.load();
  }

  load(page = 1): void {
    this.loading.set(true);
    this.userService.getUsers({ q: this.q, role: this.role, page, limit: 20 }).subscribe({
      next: (res) => {
        this.users.set(res.data);
        this.meta.set(res.meta);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.message || 'Impossible de charger les utilisateurs.');
      },
    });
  }

  search(): void {
    this.load(1);
  }

  toggleStatus(user: User): void {
    const action = user.isActive ? 'désactiver' : 'activer';
    if (!window.confirm(`Voulez-vous ${action} le compte de ${user.prenom} ${user.nom} ?`)) return;

    this.userService.toggleStatus(user._id).subscribe({
      next: (res) => {
        this.users.update((users) => users.map((item) => (item._id === user._id ? res.user : item)));
        this.toast.success(res.message);
      },
      error: (err) => this.toast.error(err.message || 'Action impossible.'),
    });
  }

  changeRole(user: User, role: Role): void {
    this.userService.updateRole(user._id, role).subscribe({
      next: (res) => {
        this.users.update((users) => users.map((item) => (item._id === user._id ? res.user : item)));
        this.toast.success('Rôle mis à jour.');
      },
      error: (err) => {
        this.toast.error(err.message || 'Changement de rôle impossible.');
        this.load(this.meta().page);
      },
    });
  }

  roleClass(role: Role): string {
    return role === 'admin' ? 'badge-closed' : role === 'restaurateur' ? 'badge-info' : 'badge-neutral';
  }

  pages(): number[] {
    return Array.from({ length: this.meta().pages }, (_, index) => index + 1);
  }
}
