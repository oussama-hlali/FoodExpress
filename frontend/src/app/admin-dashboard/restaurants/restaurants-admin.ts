import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category, PaginationMeta, Restaurant, RestaurantStatus, User } from '../../core/models/models';
import { CategoryService, RestaurantService } from '../../core/services/restaurant.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-restaurants-admin',
  imports: [ReactiveFormsModule, FormsModule, DecimalPipe],
  templateUrl: './restaurants-admin.html',
  styleUrl: './restaurants-admin.css',
})
export class RestaurantsAdmin {
  private readonly restaurantService = inject(RestaurantService);
  private readonly categoryService = inject(CategoryService);
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly restaurants = signal<Restaurant[]>([]);
  readonly meta = signal<PaginationMeta>({ total: 0, page: 1, limit: 10, pages: 1 });
  readonly owners = signal<User[]>([]);
  readonly cuisines = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly editing = signal<Restaurant | null>(null);

  q = '';
  statutFilter = '';

  readonly form = this.fb.nonNullable.group({
    nom: ['', Validators.required],
    description: ['', Validators.required],
    adresse: ['', Validators.required],
    typeCuisine: ['', Validators.required],
    image: [''],
    fraisLivraison: [5, [Validators.required, Validators.min(0)]],
    horaires: ['10:00 - 23:00'],
    isOpen: [true],
    owner: ['', Validators.required],
    statut: this.fb.nonNullable.control<RestaurantStatus>('valide'),
  });

  constructor() {
    this.load();
    this.userService.getUsers({ role: 'restaurateur', limit: 100 }).subscribe({
      next: (res) => this.owners.set(res.data),
      error: () => undefined,
    });
    this.categoryService.getCuisines().subscribe({
      next: (cuisines) => this.cuisines.set(cuisines),
      error: () => undefined,
    });
  }

  load(page = 1): void {
    this.loading.set(true);
    this.restaurantService
      .getRestaurants({
        q: this.q,
        statut: this.statutFilter || undefined,
        page,
        limit: 10,
      })
      .subscribe({
        next: (res) => {
          this.restaurants.set(res.data);
          this.meta.set(res.meta);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(err.message || 'Impossible de charger les restaurants.');
        },
      });
  }

  search(): void {
    this.load(1);
  }

  ownerName(restaurant: Restaurant): string {
    if (typeof restaurant.owner === 'object' && restaurant.owner) {
      return `${restaurant.owner.prenom} ${restaurant.owner.nom}`;
    }
    return '—';
  }

  openCreate(): void {
    this.editing.set(null);
    this.form.reset({
      nom: '',
      description: '',
      adresse: '',
      typeCuisine: this.cuisines()[0]?.nom ?? '',
      image: '/images/hero.jpg',
      fraisLivraison: 5,
      horaires: '10:00 - 23:00',
      isOpen: true,
      owner: this.owners()[0]?._id ?? '',
      statut: 'valide',
    });
    this.showForm.set(true);
  }

  openEdit(restaurant: Restaurant): void {
    this.editing.set(restaurant);
    this.form.reset({
      nom: restaurant.nom,
      description: restaurant.description,
      adresse: restaurant.adresse,
      typeCuisine: restaurant.typeCuisine,
      image: restaurant.image,
      fraisLivraison: restaurant.fraisLivraison,
      horaires: restaurant.horaires,
      isOpen: restaurant.isOpen,
      owner: typeof restaurant.owner === 'string' ? restaurant.owner : restaurant.owner._id,
      statut: restaurant.statut,
    });
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editing.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.owners().length) {
      this.toast.error('Créez d’abord un compte restaurateur (rôle à modifier dans Utilisateurs).');
      return;
    }

    const payload = { ...this.form.getRawValue(), fraisLivraison: Number(this.form.getRawValue().fraisLivraison) };
    this.saving.set(true);
    const request = this.editing()
      ? this.restaurantService.update(this.editing()!._id, payload)
      : this.restaurantService.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(this.editing() ? 'Restaurant mis à jour.' : 'Restaurant créé.');
        this.cancelForm();
        this.load(this.meta().page);
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err.message || 'Enregistrement impossible.');
      },
    });
  }

  setStatus(restaurant: Restaurant, statut: RestaurantStatus): void {
    this.restaurantService.updateStatus(restaurant._id, statut).subscribe({
      next: () => {
        this.toast.success('Statut du restaurant mis à jour.');
        this.load(this.meta().page);
      },
      error: (err) => this.toast.error(err.message || 'Action impossible.'),
    });
  }

  remove(restaurant: Restaurant): void {
    if (!window.confirm(`Supprimer « ${restaurant.nom} » et tout son menu ?`)) return;
    this.restaurantService.delete(restaurant._id).subscribe({
      next: () => {
        this.toast.success('Restaurant supprimé.');
        this.load(this.meta().page);
      },
      error: (err) => this.toast.error(err.message || 'Suppression impossible.'),
    });
  }

  statusClass(statut: RestaurantStatus): string {
    return statut === 'valide' ? 'badge-open' : statut === 'en_attente' ? 'badge-pending' : 'badge-closed';
  }

  statusLabel(statut: RestaurantStatus): string {
    return statut === 'valide' ? 'Validé' : statut === 'en_attente' ? 'En attente' : 'Suspendu';
  }

  pages(): number[] {
    return Array.from({ length: this.meta().pages }, (_, index) => index + 1);
  }
}
