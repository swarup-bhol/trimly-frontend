import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  private unwrap<T>(obs: Observable<ApiResponse<T>>): Observable<T> {
    return obs.pipe(map(r => r.data));
  }

  get<T>(path: string, params?: Record<string, string>): Observable<T> {
    let p = new HttpParams();
    if (params) Object.entries(params).forEach(([k, v]) => p = p.set(k, v));
    return this.unwrap(this.http.get<ApiResponse<T>>(`${this.base}${path}`, { params: p }));
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.unwrap(this.http.post<ApiResponse<T>>(`${this.base}${path}`, body));
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.unwrap(this.http.put<ApiResponse<T>>(`${this.base}${path}`, body));
  }

  patch<T>(path: string, body?: unknown): Observable<T> {
    return this.unwrap(this.http.patch<ApiResponse<T>>(`${this.base}${path}`, body ?? {}));
  }

  delete<T>(path: string): Observable<T> {
    return this.unwrap(this.http.delete<ApiResponse<T>>(`${this.base}${path}`));
  }

  patchWithParams<T>(path: string, params: Record<string, string>): Observable<T> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => p = p.set(k, v));
    return this.unwrap(this.http.patch<ApiResponse<T>>(`${this.base}${path}`, {}, { params: p }));
  }
}
