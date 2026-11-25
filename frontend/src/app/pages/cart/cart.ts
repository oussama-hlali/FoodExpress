import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

/** Panier : gestion des articles et contrôle d'accès au checkout. */
@Component({
  selector: 'app-cart',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class CartPage {
  readonly cart = inject(CartService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** Retire un plat et prévient l'utilisateur par toast. */
  remove(platId: string, nom: string): void {
    this.cart.remove(platId);
    this.toast.info(`${nom} retiré du panier.`);
  }

  /** Vide le panier après confirmation. */
  clearCart(): void {
    if (window.confirm('Voulez-vous vraiment vider votre panier ?')) {
      this.cart.clear();
      this.toast.info('Panier vidé.');
    }
  }

  /** Contrôle d'accès avant d'ouvrir la page de commande. */
  goToCheckout(): void {
    if (!this.auth.isLoggedIn()) {
      // Invité : ?redirect mémorise /checkout pour revenir après connexion.
      this.router.navigate(['/login'], { queryParams: { redirect: '/checkout' } });
      return;
    }
    // Seuls les comptes clients peuvent passer commande.
    if (this.auth.role() !== 'client') {
      this.toast.error('Seuls les comptes clients peuvent passer commande.');
      return;
    }
    this.router.navigate(['/checkout']);
  }
}
