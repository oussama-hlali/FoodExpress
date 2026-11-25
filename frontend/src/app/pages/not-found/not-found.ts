import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Page 404 affichée pour les routes inconnues. */
@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section class="container py-5 text-center">
      <div class="display-1 fw-bold text-brand">404</div>
      <h1 class="h3 mb-2">Cette page n’existe pas</h1>
      <p class="text-muted-2 mb-4">Le lien est peut-être obsolète ou la page a été déplacée.</p>
      <a routerLink="/" class="btn btn-brand">Retour à l’accueil</a>
    </section>
  `,
})
export class NotFound {}
