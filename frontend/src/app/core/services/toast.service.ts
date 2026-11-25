import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  // Signal privé : les composants ne font que lire la liste.
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  // Identifiant croissant pour retirer un toast précis.
  private nextId = 1;

  /** Affiche une confirmation. */
  success(message: string): void {
    this.push(message, 'success');
  }

  /** Affiche une erreur. */
  error(message: string): void {
    this.push(message, 'error');
  }

  /** Affiche une information neutre. */
  info(message: string): void {
    this.push(message, 'info');
  }

  /** Retire manuellement un toast par son id. */
  dismiss(id: number): void {
    this._toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private push(message: string, type: Toast['type']): void {
    const id = this.nextId++;
    this._toasts.update((toasts) => [...toasts, { id, message, type }]);
    // Disparition automatique après 4 secondes.
    setTimeout(() => this.dismiss(id), 4000);
  }
}
