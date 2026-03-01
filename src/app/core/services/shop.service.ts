import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse, ShopResponse, SlotAvailabilityResponse,
  LocationMeta, ServiceRequest, ServiceResponse,
  ShopUpdateRequest, DashboardStats
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class ShopService {

  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Public (no auth) ──────────────────────────────────────────────────────

  getPublicShops(q?: string, city?: string, area?: string): Observable<ApiResponse<ShopResponse[]>> {
    let params = new HttpParams();
    if (q)    params = params.set('q', q);
    if (city) params = params.set('city', city);
    if (area) params = params.set('area', area);
    return this.http.get<ApiResponse<ShopResponse[]>>(`${this.api}/shops/public`, { params });
  }

  getShopById(id: number): Observable<ApiResponse<ShopResponse>> {
    return this.http.get<ApiResponse<ShopResponse>>(`${this.api}/shops/public/${id}`);
  }

  getShopBySlug(slug: string): Observable<ApiResponse<ShopResponse>> {
    return this.http.get<ApiResponse<ShopResponse>>(`${this.api}/shops/public/slug/${slug}`);
  }

  getSlots(shopId: number, date: string): Observable<ApiResponse<SlotAvailabilityResponse>> {
    return this.http.get<ApiResponse<SlotAvailabilityResponse>>(
      `${this.api}/shops/${shopId}/slots`, { params: { date } }
    );
  }

  getLocationMeta(): Observable<ApiResponse<LocationMeta>> {
    return this.http.get<ApiResponse<LocationMeta>>(`${this.api}/location/meta`);
  }

  // ── Barber ────────────────────────────────────────────────────────────────

  getMyShop(): Observable<ApiResponse<ShopResponse>> {
    return this.http.get<ApiResponse<ShopResponse>>(`${this.api}/barber/shop`);
  }

  updateMyShop(req: ShopUpdateRequest): Observable<ApiResponse<ShopResponse>> {
    return this.http.patch<ApiResponse<ShopResponse>>(`${this.api}/barber/shop`, req);
  }

  addService(req: ServiceRequest): Observable<ApiResponse<ServiceResponse>> {
    return this.http.post<ApiResponse<ServiceResponse>>(`${this.api}/barber/services`, req);
  }

  updateService(id: number, req: ServiceRequest): Observable<ApiResponse<ServiceResponse>> {
    return this.http.put<ApiResponse<ServiceResponse>>(`${this.api}/barber/services/${id}`, req);
  }

  toggleService(id: number): Observable<ApiResponse<ServiceResponse>> {
    return this.http.patch<ApiResponse<ServiceResponse>>(`${this.api}/barber/services/${id}/toggle`, {});
  }

  deleteService(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/barber/services/${id}`);
  }

  getBlockedSlots(date: string): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.api}/barber/blocked-slots?date=${date}`);
  }

  blockSlot(date: string, slotTime: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.api}/barber/blocked-slots`, { date, slotTime });
  }

  unblockSlot(date: string, slotTime: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/barber/blocked-slots`, { body: { date, slotTime } });
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  adminGetAllShops(): Observable<ApiResponse<ShopResponse[]>> {
    return this.http.get<ApiResponse<ShopResponse[]>>(`${this.api}/admin/shops`);
  }

  adminApprove(id: number): Observable<ApiResponse<ShopResponse>> {
    return this.http.post<ApiResponse<ShopResponse>>(`${this.api}/admin/shops/${id}/approve`, {});
  }

  adminDisable(id: number): Observable<ApiResponse<ShopResponse>> {
    return this.http.post<ApiResponse<ShopResponse>>(`${this.api}/admin/shops/${id}/disable`, {});
  }

  adminEnable(id: number): Observable<ApiResponse<ShopResponse>> {
    return this.http.post<ApiResponse<ShopResponse>>(`${this.api}/admin/shops/${id}/enable`, {});
  }

  adminSetCommission(id: number, percent: number): Observable<ApiResponse<ShopResponse>> {
    return this.http.patch<ApiResponse<ShopResponse>>(
      `${this.api}/admin/shops/${id}/commission`, { percent }
    );
  }
}
