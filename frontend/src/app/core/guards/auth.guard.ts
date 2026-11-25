import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Bloque l'accès aux pages privées aux visiteurs non connectés. */
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;

  // On retient la page demandée pour y revenir après connexion.
  return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
};

/** Restreint une route à certains rôles. */
export const roleGuard = (...roles: string[]): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);

  // Rôle fourni par le signal d'auth, alimenté au login/refresh.
  const role = auth.role();
  if (role && roles.includes(role)) return true;

  // Mauvais rôle : on renvoie vers l'espace du rôle courant.
  return router.createUrlTree([role === 'admin' ? '/admin' : role === 'restaurateur' ? '/restaurant' : '/']);
};

/** Empêche un utilisateur connecté d'ouvrir login / register. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) return true;

  // Déjà connecté : on évite de réafficher login/register.
  const role = auth.role();
  return router.createUrlTree([role === 'admin' ? '/admin' : role === 'restaurateur' ? '/restaurant' : '/']);
};
