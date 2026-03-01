import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse, BookingRequest, BookingResponse,
  RatingRequest, RescheduleRequest, RescheduleResponseRequest, DashboardStats
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class BookingService {

  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── Customer ──────────────────────────────────────────────────────────────

  createBooking(req: BookingRequest): Observable<ApiResponse<BookingResponse>> {
    return this.http.post<ApiResponse<BookingResponse>>(`${this.api}/customer/bookings`, req);
  }

  getMyBookings(): Observable<ApiResponse<BookingResponse[]>> {
    return this.http.get<ApiResponse<BookingResponse[]>>(`${this.api}/customer/bookings`);
  }

  cancelMyBooking(id: number): Observable<ApiResponse<BookingResponse>> {
    return this.http.post<ApiResponse<BookingResponse>>(`${this.api}/customer/bookings/${id}/cancel`, {});
  }

  rateBooking(id: number, req: RatingRequest): Observable<ApiResponse<BookingResponse>> {
    return this.http.post<ApiResponse<BookingResponse>>(`${this.api}/customer/bookings/${id}/rate`, req);
  }

  respondReschedule(id: number, accept: boolean): Observable<ApiResponse<BookingResponse>> {
    const req: RescheduleResponseRequest = { accept };
    return this.http.post<ApiResponse<BookingResponse>>(
      `${this.api}/customer/bookings/${id}/reschedule/respond`, req
    );
  }

  updateProfile(fullName: string): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.api}/customer/profile`, { fullName });
  }

  // ── Barber ────────────────────────────────────────────────────────────────

  getBarberBookings(status?: string): Observable<ApiResponse<BookingResponse[]>> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<BookingResponse[]>>(`${this.api}/barber/bookings`, { params });
  }

  getBarberStats(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(`${this.api}/barber/bookings/stats`);
  }

  acceptBooking(id: number): Observable<ApiResponse<BookingResponse>> {
    return this.http.post<ApiResponse<BookingResponse>>(`${this.api}/barber/bookings/${id}/accept`, {});
  }

  rejectBooking(id: number, reason?: string): Observable<ApiResponse<BookingResponse>> {
    return this.http.post<ApiResponse<BookingResponse>>(
      `${this.api}/barber/bookings/${id}/reject`, { cancelReason: reason }
    );
  }

  cancelBooking(id: number, reason?: string): Observable<ApiResponse<BookingResponse>> {
    return this.http.post<ApiResponse<BookingResponse>>(
      `${this.api}/barber/bookings/${id}/cancel`, { cancelReason: reason }
    );
  }

  completeBooking(id: number): Observable<ApiResponse<BookingResponse>> {
    return this.http.post<ApiResponse<BookingResponse>>(`${this.api}/barber/bookings/${id}/complete`, {});
  }

  requestReschedule(id: number, req: RescheduleRequest): Observable<ApiResponse<BookingResponse>> {
    return this.http.post<ApiResponse<BookingResponse>>(
      `${this.api}/barber/bookings/${id}/reschedule`, req
    );
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  adminGetAllBookings(status?: string): Observable<ApiResponse<BookingResponse[]>> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<BookingResponse[]>>(`${this.api}/admin/bookings`, { params });
  }

  adminGetStats(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(`${this.api}/admin/stats`);
  }
}
