import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Category, Dish, Restaurant } from '../../core/models/models';
import { CategoryService, DishService, RestaurantService } from '../../core/services/restaurant.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-manage-dishes',
  imports: [ReactiveFormsModule, FormsModule, DecimalPipe],
  templateUrl: './manage-dishes.html',
  styleUrl: './manage-dishes.css',
})
export class ManageDishes {
  private readonly restaurantService = inject(RestaurantService);
  private readonly categoryService = inject(CategoryService);
  private readonly dishService = inject(DishService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly restaurants = signal<Restaurant[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly dishes = signal<Dish[]>([]);
  readonly selectedRestaurantId = signal('');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly editing = signal<Dish | null>(null);
  newCategory = '';

  readonly form = this.fb.nonNullable.group({
    nom: ['', [Validators.required, Validators.maxLength(80)]],
    description: ['', Validators.maxLength(400)],
    prix: [0, [Validators.required, Validators.min(0.1)]],
    categorie: ['', Validators.required],
    image: [''],
    disponible: [true],
  });

  constructor() {
    this.restaurantService.getMine().subscribe({
      next: (restaurants) => {
        this.restaurants.set(restaurants);
        if (restaurants.length) {
          this.selectedRestaurantId.set(restaurants[0]._id);
          this.loadMenu(restaurants[0]._id);
        } else {
          this.loading.set(false);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.message || 'Impossible de charger vos restaurants.');
      },
    });
  }

  get selectedRestaurant(): Restaurant | undefined {
    return this.restaurants().find((restaurant) => restaurant._id === this.selectedRestaurantId());
  }

  onRestaurantChange(id: string): void {
    this.selectedRestaurantId.set(id);
    this.showForm.set(false);
    this.loadMenu(id);
  }

  loadMenu(restaurantId = this.selectedRestaurantId()): void {
    if (!restaurantId) return;
    this.loading.set(true);
    this.categoryService.getByRestaurant(restaurantId).subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.categories.set([]),
    });
    this.dishService.getDishes({ restaurant: restaurantId }).subscribe({
      next: (res) => {
        this.dishes.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.message || 'Impossible de charger les plats.');
      },
    });
  }

  categoryName(dish: Dish): string {
    if (typeof dish.categorie === 'object' && dish.categorie) return dish.categorie.nom;
    return this.categories().find((category) => category._id === dish.categorie)?.nom ?? '—';
  }

  openCreate(): void {
    this.editing.set(null);
    this.form.reset({
      nom: '',
      description: '',
      prix: 0,
      categorie: this.categories()[0]?._id ?? '',
      image: '',
      disponible: true,
    });
    this.showForm.set(true);
  }

  openEdit(dish: Dish): void {
    this.editing.set(dish);
    const categoryId = typeof dish.categorie === 'string' ? dish.categorie : dish.categorie._id;
    this.form.reset({
      nom: dish.nom,
      description: dish.description,
      prix: dish.prix,
      categorie: categoryId,
      image: dish.image,
      disponible: dish.disponible,
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
    if (!this.categories().length) {
      this.toast.error('Créez d’abord une catégorie pour ce restaurant.');
      return;
    }

    const values = this.form.getRawValue();
    const payload = {
      ...values,
      prix: Number(values.prix),
      restaurant: this.selectedRestaurantId(),
    };

    this.saving.set(true);
    const request = this.editing()
      ? this.dishService.update(this.editing()!._id, payload)
      : this.dishService.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(this.editing() ? 'Plat mis à jour.' : 'Plat ajouté au menu.');
        this.cancelForm();
        this.loadMenu();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err.message || 'Enregistrement impossible.');
      },
    });
  }

  toggleAvailability(dish: Dish): void {
    this.dishService.toggleAvailability(dish._id).subscribe({
      next: (res) => {
        this.dishes.update((dishes) => dishes.map((item) => (item._id === dish._id ? res.dish : item)));
        this.toast.success(res.message);
      },
      error: (err) => this.toast.error(err.message || 'Mise à jour impossible.'),
    });
  }

  remove(dish: Dish): void {
    if (!window.confirm(`Supprimer le plat « ${dish.nom} » ?`)) return;
    this.dishService.delete(dish._id).subscribe({
      next: () => {
        this.toast.success('Plat supprimé.');
        this.loadMenu();
      },
      error: (err) => this.toast.error(err.message || 'Suppression impossible.'),
    });
  }

  addCategory(): void {
    const nom = this.newCategory.trim();
    if (!nom) return;

    this.categoryService
      .create({ nom, type: 'plat', restaurant: this.selectedRestaurantId() })
      .subscribe({
        next: () => {
          this.newCategory = '';
          this.toast.success('Catégorie ajoutée.');
          this.loadMenu();
        },
        error: (err) => this.toast.error(err.message || 'Impossible d’ajouter la catégorie.'),
      });
  }

  removeCategory(category: Category): void {
    if (!window.confirm(`Supprimer la catégorie « ${category.nom} » ?`)) return;
    this.categoryService.delete(category._id).subscribe({
      next: () => {
        this.toast.success('Catégorie supprimée.');
        this.loadMenu();
      },
      error: (err) => this.toast.error(err.message || 'Suppression impossible.'),
    });
  }
}
