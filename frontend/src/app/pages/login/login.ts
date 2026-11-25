import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

/** Page de connexion avec formulaire réactif et redirection selon le rôle. */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: '../auth.css',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  /** Connecte l'utilisateur puis redirige selon le rôle ou la page demandée. */
  submit(): void {
    this.error.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toast.success(`Bienvenue ${res.user.prenom} !`);
        // ?redirect= permet de revenir à la page protégée demandée.
        const redirect = this.route.snapshot.queryParamMap.get('redirect');
        if (redirect) {
          this.router.navigateByUrl(redirect);
          return;
        }
        const role = res.user.role;
        this.router.navigate([role === 'admin' ? '/admin' : role === 'restaurateur' ? '/restaurant' : '/']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.message || 'Connexion impossible.');
      },
    });
  }

  fillDemo(email: string, password: string): void {
    this.form.setValue({ email, password });
  }
}
