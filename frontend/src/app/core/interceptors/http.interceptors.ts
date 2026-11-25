import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Ajoute le token JWT aux requêtes sortantes. */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  // Même clé que celle utilisée par AuthService.
  const token = localStorage.getItem('foodexpress_token');
  if (!token) return next(req);

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    })
  );
};

/** Normalise les messages d'erreur et déconnecte si le token est invalide. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 hors login : session expirée, on déconnecte l'utilisateur.
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        auth.logout();
      }

      // Message du backend > erreur réseau > message générique.
      const message =
        error.error?.message ||
        (error.status === 0
          ? 'Serveur injoignable. Vérifiez que l’API est démarrée sur le port 5000.'
          : 'Une erreur est survenue.');

      return throwError(() => ({ ...error, message }));
    })
  );
};
