import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Paginated, Role, User } from '../models/models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/users`;

  /** Liste paginée des utilisateurs (admin uniquement). */
  getUsers(filters: { q?: string; role?: string; isActive?: boolean; page?: number; limit?: number } = {}): Observable<
    Paginated<User>
  > {
    let params = new HttpParams().set('limit', '20');
    // Seuls les filtres renseignés sont envoyés.
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    });
    return this.http.get<Paginated<User>>(this.base, { params });
  }

  /** Active ou désactive un compte (admin). */
  toggleStatus(id: string): Observable<{ message: string; user: User }> {
    return this.http.put<{ message: string; user: User }>(`${this.base}/${id}/status`, {});
  }

  /** Change le rôle d'un utilisateur (admin). */
  updateRole(id: string, role: Role): Observable<{ message: string; user: User }> {
    return this.http.put<{ message: string; user: User }>(`${this.base}/${id}/role`, { role });
  }
}
