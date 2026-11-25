import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Category } from '../../core/models/models';
import { CategoryService } from '../../core/services/restaurant.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-categories',
  imports: [FormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories {
  private readonly categoryService = inject(CategoryService);
  private readonly toast = inject(ToastService);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);

  nom = '';
  description = '';
  editNom = '';
  editDescription = '';

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.categoryService.getCuisines().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.message || 'Impossible de charger les catégories.');
      },
    });
  }

  create(): void {
    if (!this.nom.trim()) {
      this.toast.error('Le nom de la catégorie est obligatoire.');
      return;
    }

    this.saving.set(true);
    this.categoryService.create({ nom: this.nom.trim(), description: this.description.trim(), type: 'cuisine' }).subscribe({
      next: () => {
        this.saving.set(false);
        this.nom = '';
        this.description = '';
        this.toast.success('Catégorie ajoutée.');
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err.message || 'Ajout impossible.');
      },
    });
  }

  startEdit(category: Category): void {
    this.editingId.set(category._id);
    this.editNom = category.nom;
    this.editDescription = category.description ?? '';
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(category: Category): void {
    if (!this.editNom.trim()) return;
    this.categoryService
      .update(category._id, { nom: this.editNom.trim(), description: this.editDescription.trim() })
      .subscribe({
        next: () => {
          this.toast.success('Catégorie mise à jour.');
          this.editingId.set(null);
          this.load();
        },
        error: (err) => this.toast.error(err.message || 'Modification impossible.'),
      });
  }

  remove(category: Category): void {
    if (!window.confirm(`Supprimer la catégorie « ${category.nom} » ?`)) return;
    this.categoryService.delete(category._id).subscribe({
      next: () => {
        this.toast.success('Catégorie supprimée.');
        this.load();
      },
      error: (err) => this.toast.error(err.message || 'Suppression impossible.'),
    });
  }
}
