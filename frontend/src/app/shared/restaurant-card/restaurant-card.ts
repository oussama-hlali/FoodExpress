import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Restaurant } from '../../core/models/models';

/** Carte réutilisable affichant un restaurant. */
@Component({
  selector: 'app-restaurant-card',
  imports: [RouterLink, DecimalPipe],
  templateUrl: './restaurant-card.html',
})
export class RestaurantCard {
  // Signal d'entrée requis : le restaurant est fourni par le composant parent.
  readonly restaurant = input.required<Restaurant>();
}
