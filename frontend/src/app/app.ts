import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/navbar/navbar';
import { Footer } from './shared/footer/footer';
import { ToastContainer } from './shared/toast/toast';
import { AuthService } from './core/services/auth.service';

@Component({
  imports: [RouterOutlet, Navbar, Footer, ToastContainer],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly auth = inject(AuthService);

  constructor() {
    // Rafraîchit les informations du compte au démarrage (et détecte un compte désactivé).
    this.auth.refreshMe();
  }
}
