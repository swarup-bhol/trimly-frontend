import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse, ApiResponse, SendOtpRequest, VerifyOtpRequest,
  LoginRequest, BarberRegisterRequest, LogoutRequest, TrimlySession,
  UserInfo, RefreshRequest
} from '../models/models';

const SESSION_KEY = 'trimly_session';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly api = environment.apiUrl;

  // Signals for reactive auth state
  private _session = signal<TrimlySession | null>(this.loadSession());
  readonly session = this._session.asReadonly();
  readonly user = computed(() => this._session()?.user ?? null);
  readonly isLoggedIn = computed(() => !!this._session());
  readonly isCustomer = computed(() => this._session()?.user?.role === 'CUSTOMER');
  readonly isBarber = computed(() => this._session()?.user?.role === 'BARBER');
  readonly isAdmin = computed(() => this._session()?.user?.role === 'ADMIN');

  constructor(private http: HttpClient, private router: Router) {}

  // ── OTP Login (Customer) ──────────────────────────────────────────────────

  sendOtp(phone: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.api}/auth/otp/send`, { phone });
  }

  verifyOtp(phone: string, otp: string, fullName?: string): Observable<ApiResponse<AuthResponse>> {
    const body: VerifyOtpRequest = { phone, otp, fullName };
    return this.http.post<ApiResponse<AuthResponse>>(`${this.api}/auth/otp/verify`, body)
      .pipe(tap(res => res.data && this.saveSession(res.data)));
  }

  // ── Email+Password Login (Barber/Admin) ───────────────────────────────────

  login(email: string, password: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.api}/auth/login`, { email, password })
      .pipe(tap(res => res.data && this.saveSession(res.data)));
  }

  // ── Barber Registration ───────────────────────────────────────────────────

  registerBarber(req: BarberRegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.api}/auth/register/barber`, req)
      .pipe(tap(res => res.data && this.saveSession(res.data)));
  }

  // ── Silent Refresh — called by interceptor when access token expires ──────

  refreshToken(): Observable<ApiResponse<AuthResponse>> {
    const session = this._session();
    if (!session?.refreshToken) return throwError(() => new Error('No refresh token'));

    const body: RefreshRequest = { refreshToken: session.refreshToken };
    return this.http.post<ApiResponse<AuthResponse>>(`${this.api}/auth/refresh`, body)
      .pipe(tap(res => {
        if (res.data) {
          // Update access token while keeping the same refresh token
          this.saveSession(res.data);
        }
      }));
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  logout(allDevices = false): void {
    const session = this._session();
    const body: LogoutRequest = {
      refreshToken: session?.refreshToken,
      allDevices
    };
    // Fire-and-forget — clear local state regardless of server response
    this.http.post(`${this.api}/auth/logout`, body).subscribe({ error: () => {} });
    this.clearSession();
    this.router.navigate(['/']);
  }

  // ── Get current user ──────────────────────────────────────────────────────

  getMe(): Observable<ApiResponse<UserInfo>> {
    return this.http.get<ApiResponse<UserInfo>>(`${this.api}/auth/me`);
  }

  // ── Password reset ────────────────────────────────────────────────────────

  forgotPassword(email: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.api}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.api}/auth/reset-password`, { token, newPassword });
  }

  // ── Session helpers ───────────────────────────────────────────────────────

  getAccessToken(): string | null {
    return this._session()?.accessToken ?? null;
  }

  updateProfile(fullName: string): Observable<ApiResponse<UserInfo>> {
    return this.http.patch<ApiResponse<UserInfo>>(`${this.api}/auth/profile`, { fullName })
      .pipe(tap(res => { if (res.data) this.updateUser(res.data); }));
  }

  updateUser(user: UserInfo): void {
    const session = this._session();
    if (session) {
      const updated = { ...session, user };
      this._session.set(updated);
      localStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    }
  }

  private saveSession(auth: AuthResponse): void {
    const session: TrimlySession = {
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      user: auth.user
    };
    console.log("[AuthService] saveSession, user:", auth.user);
    this._session.set(session);
    console.log("[AuthService] signal set, role:", this.user()?.role);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  private clearSession(): void {
    this._session.set(null);
    localStorage.removeItem(SESSION_KEY);
  }

  private loadSession(): TrimlySession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Validate shape — must have accessToken + user.role (not old {token, role} format)
      if (!parsed?.accessToken || !parsed?.user?.role) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return parsed as TrimlySession;
    } catch {
      return null;
    }
  }
}
