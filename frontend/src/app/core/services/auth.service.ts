import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, User } from '../models/models';

const TOKEN_KEY = 'foodexpress_token';
const USER_KEY = 'foodexpress_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _user = signal<User | null>(this.readUser());
  readonly user = this._user.asReadonly();
  // computed : connexion et rôle dérivés du signal utilisateur.
  readonly isLoggedIn = computed(() => !!this._user());
  readonly role = computed(() => this._user()?.role ?? null);

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /** Connecte l'utilisateur et ouvre la session (token + user en localStorage). */
  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(tap((res) => this.setSession(res)));
  }

  /** Crée un compte et ouvre directement la session. */
  register(payload: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    password: string;
    confirmPassword: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, payload)
      .pipe(tap((res) => this.setSession(res)));
  }

  /** Vérifie le token au démarrage ; déconnecte si la session est invalide. */
  refreshMe(): void {
    if (!this.token) return;
    this.http.get<User>(`${environment.apiUrl}/auth/me`).subscribe({
      next: (user) => {
        this._user.set(user);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      },
      // Session invalide : on nettoie le localStorage et le signal.
      error: () => this.logout(),
    });
  }

  /** Met à jour le profil et son miroir dans localStorage. */
  updateProfile(payload: { nom: string; prenom: string; telephone: string }): Observable<{ message: string; user: User }> {
    return this.http
      .put<{ message: string; user: User }>(`${environment.apiUrl}/auth/profile`, payload)
      .pipe(
        tap((res) => {
          this._user.set(res.user);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        })
      );
  }

  /** Change le mot de passe sans modifier la session en cours. */
  changePassword(payload: { currentPassword: string; newPassword: string; confirmPassword: string }): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${environment.apiUrl}/auth/password`, payload);
  }

  /** Efface la session et redirige vers l'accueil. */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
    this.router.navigate(['/']);
  }

  private setSession(res: AuthResponse): void {
    // Persistance : token puis utilisateur avant mise à jour du signal.
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this._user.set(res.user);
  }

  private readUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      // JSON corrompu : on repart sans utilisateur.
      return null;
    }
  }
}
