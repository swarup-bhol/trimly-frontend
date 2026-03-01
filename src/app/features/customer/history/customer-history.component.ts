import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingService } from '../../../core/services/booking.service';
import { ToastService } from '../../../core/services/toast.service';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { RatingCardComponent } from '../../../shared/components/rating-card/rating-card.component';
import { BookingResponse } from '../../../core/models/models';

@Component({
  selector: 'app-customer-history',
  standalone: true,
  imports: [CommonModule, BadgeComponent, RatingCardComponent],
  template: `
    <div class="page anim-fade-up">
      <div class="ph">
        <div class="ph-title">My Bookings 📅</div>
        <div class="ph-sub">{{ bookings.length }} total bookings</div>
      </div>

      @if (bookings.length === 0) {
        <div class="empty">
          <div class="ei">📅</div>
          <div class="et">No bookings yet. Browse shops to book your first appointment!</div>
        </div>
      } @else {

        <!-- Upcoming -->
        @if (upcoming().length > 0) {
          <div class="card" style="margin-bottom:14px">
            <div class="ch"><div class="ct">Upcoming</div></div>
            @for (b of upcoming(); track b.id) {
              <div class="bk">
                <div class="bk-av">{{ (b.shopEmoji || '✂️') }}</div>
                <div class="bk-body">
                  <div class="bk-name">{{ b.shopName }}</div>
                  <div class="bk-detail">{{ b.servicesSnapshot }}</div>
                  <div class="bk-detail">📅 {{ b.bookingDate }} at {{ b.slotTime }}</div>
                  <div class="bk-tags">
                    <app-badge [status]="b.status"></app-badge>
                    @if (b.rescheduleStatus === 'PENDING') {
                      <span class="badge by">🔄 Reschedule Pending</span>
                    }
                  </div>
                  @if (b.rescheduleStatus === 'PENDING') {
                    <div style="margin-top:10px;padding:10px;background:var(--amber-dim);border:1px solid rgba(245,166,35,0.2);border-radius:8px;font-size:12px">
                      <div style="font-weight:700;color:var(--amber);margin-bottom:4px">🔄 Reschedule Request</div>
                      <div style="color:var(--text2)">Barber proposed: <b>{{ b.rescheduleDate }} at {{ b.rescheduleTime }}</b></div>
                      @if (b.rescheduleReason) { <div style="color:var(--text3);margin-top:2px">Reason: {{ b.rescheduleReason }}</div> }
                      <div style="display:flex;gap:8px;margin-top:8px">
                        <button class="btn btn-emerald btn-sm" (click)="respond(b.id, true)">✓ Accept</button>
                        <button class="btn btn-crimson btn-sm" (click)="respond(b.id, false)">✕ Decline</button>
                      </div>
                    </div>
                  }
                  <div class="bk-actions">
                    <div class="bk-amt">₹{{ b.totalAmount }}</div>
                    @if (b.status === 'PENDING' || b.status === 'CONFIRMED') {
                      <button class="btn btn-crimson btn-sm" (click)="cancel(b.id)">Cancel</button>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }

        <!-- Past -->
        @if (past().length > 0) {
          <div class="card">
            <div class="ch"><div class="ct">Past Bookings</div></div>
            @for (b of past(); track b.id) {
              <div class="pb-card">
                <div class="pb-ico">{{ b.shopEmoji || '✂️' }}</div>
                <div style="flex:1;min-width:0">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
                    <div style="font-size:13px;font-weight:700">{{ b.shopName }}</div>
                    <app-badge [status]="b.status"></app-badge>
                  </div>
                  <div style="font-size:12px;color:var(--text2);margin-top:2px">{{ b.servicesSnapshot }}</div>
                  <div style="font-size:11px;color:var(--text3);margin-top:2px">📅 {{ b.bookingDate }} · ₹{{ b.totalAmount }}</div>
                  @if (b.status === 'COMPLETED' && !b.rating) {
                    <app-rating-card [bookingId]="b.id" [barberName]="b.shopName"
                      (rated)="submitRating(b.id, $event)"></app-rating-card>
                  }
                  @if (b.rating) {
                    <div style="margin-top:8px;display:flex;align-items:center;gap:6px">
                      <div style="display:flex;gap:2px">
                        @for (s of [1,2,3,4,5]; track s) {
                          <span [style.color]="s <= b.rating! ? 'var(--amber)' : 'var(--border2)'">★</span>
                        }
                      </div>
                      @if (b.review) { <span style="font-size:12px;color:var(--text2)">"{{ b.review }}"</span> }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      }
    </div>
  `
})
export class CustomerHistoryComponent {
  @Input() bookings: BookingResponse[] = [];
  @Output() refresh = new EventEmitter<void>();

  bookSvc = inject(BookingService);
  toast = inject(ToastService);

  upcoming() {
    return this.bookings.filter(b => ['PENDING','CONFIRMED'].includes(b.status));
  }
  past() {
    return this.bookings.filter(b => ['COMPLETED','CANCELLED','REJECTED'].includes(b.status));
  }

  cancel(id: number) {
    this.bookSvc.cancelMyBooking(id).subscribe({
      next: () => { this.toast.ok('Booking cancelled'); this.refresh.emit(); },
      error: e => this.toast.err('Failed', e.error?.message)
    });
  }

  respond(id: number, accept: boolean) {
    this.bookSvc.respondReschedule(id, accept).subscribe({
      next: () => { this.toast.ok(accept ? 'Reschedule accepted ✅' : 'Reschedule declined'); this.refresh.emit(); },
      error: e => this.toast.err('Failed', e.error?.message)
    });
  }

  submitRating(id: number, ev: { rating: number; review: string }) {
    this.bookSvc.rateBooking(id, ev).subscribe({
      next: () => { this.toast.ok('Review submitted! ⭐'); this.refresh.emit(); },
      error: e => this.toast.err('Failed', e.error?.message)
    });
  }
}
