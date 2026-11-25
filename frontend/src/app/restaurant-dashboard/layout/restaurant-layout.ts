import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-restaurant-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './restaurant-layout.html',
  styleUrl: './dashboard-shared.css',
})
export class RestaurantLayout {
  readonly auth = inject(AuthService);
}
