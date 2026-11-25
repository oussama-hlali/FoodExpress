import { Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';

/** Page de commande : formulaire de livraison et confirmation. */
@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout {
  private readonly fb = inject(FormBuilder);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly cart = inject(CartService);
  readonly auth = inject(AuthService);

  readonly submitting = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    adresseLivraison: ['', [Validators.required, Validators.minLength(8)]],
    telephone: [
      this.auth.user()?.telephone ?? '',
      [Validators.required, Validators.pattern(/^[0-9+\s]{8,15}$/)],
    ],
    remarque: [''],
    modePaiement: this.fb.nonNullable.control<'livraison' | 'en_ligne'>('livraison'),
  });

  /** Valide le formulaire, crée la commande et vide le panier. */
  submit(): void {
    this.error.set('');

    if (this.cart.isEmpty()) {
      this.toast.error('Votre panier est vide.');
      this.router.navigate(['/cart']);
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Veuillez vérifier les champs du formulaire.');
      return;
    }

    const values = this.form.getRawValue();
    this.submitting.set(true);

    this.orderService
      .create({
        restaurant: this.cart.cart().restaurantId!,
        articles: this.cart.items().map((item) => ({ plat: item.plat, quantite: item.quantite })),
        adresseLivraison: values.adresseLivraison,
        telephone: values.telephone,
        remarque: values.remarque,
        modePaiement: values.modePaiement,
      })
      .subscribe({
        next: (res) => {
          this.cart.clear();
          this.submitting.set(false);
          // Total calculé par le serveur, sans recalcul côté client.
          this.toast.success(`Commande confirmée ! Total : ${res.order.total.toFixed(2)} DT`);
          this.router.navigate(['/my-orders'], { queryParams: { nouvelle: res.order._id } });
        },
        error: (err) => {
          this.submitting.set(false);
          this.error.set(err.message || 'Impossible de confirmer la commande.');
        },
      });
  }

  invalid(field: string): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && (control.touched || control.dirty);
  }
}
