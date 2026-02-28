import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthResponse } from '../models/models';

export interface Session {
  token: string;
  role: 'ADMIN' | 'BARBER' | 'CUSTOMER';
  userId: number;
  name: string;
  shopId?: number;
  shopStatus?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  private _session = signal<Session | null>(this.loadSession());
  readonly session = this._session.asReadonly();

  private loadSession(): Session | null {
    try {
      const raw = localStorage.getItem('trimly_session');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  isLoggedIn(): boolean { return !!this._session(); }
  getRole(): string | null { return this._session()?.role ?? null; }
  getToken(): string | null { return this._session()?.token ?? null; }

  loginAdmin(email: string, password: string): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/admin/login', { email, password }).pipe(
      tap(r => this.saveSession(r))
    );
  }

  loginBarber(email: string, password: string): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/barber/login', { email, password }).pipe(
      tap(r => this.saveSession(r))
    );
  }

  loginCustomer(name: string, phone: string): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/customer/login', { name, phone }).pipe(
      tap(r => this.saveSession(r))
    );
  }

  registerBarber(data: {ownerName:string; email:string; password:string; shopName:string; location:string; phone?:string}): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/barber/register', data).pipe(
      tap(r => this.saveSession(r))
    );
  }

  private saveSession(resp: AuthResponse): void {
    const session: Session = {
      token: resp.token,
      role: resp.role,
      userId: resp.userId,
      name: resp.name,
      shopId: resp.shopId,
      shopStatus: resp.shopStatus
    };
    localStorage.setItem('trimly_session', JSON.stringify(session));
    this._session.set(session);
  }

  logout(): void {
    localStorage.removeItem('trimly_session');
    this._session.set(null);
    this.router.navigate(['/']);
  }

  updateShopStatus(status: string): void {
    const s = this._session();
    if (s) {
      const updated = { ...s, shopStatus: status };
      localStorage.setItem('trimly_session', JSON.stringify(updated));
      this._session.set(updated);
    }
  }
}
