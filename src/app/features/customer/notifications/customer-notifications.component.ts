import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingService } from '../../../core/services/booking.service';
import { ToastService } from '../../../core/services/toast.service';
import { BookingResponse } from '../../../core/models/models';

@Component({
  selector: 'app-customer-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page anim-fade-up">
      <div class="ph">
        <div class="ph-title">Notifications 🔔</div>
        <div class="ph-sub">Recent activity on your bookings</div>
      </div>

      @for (b of active(); track b.id) {
        <div class="wa-notif">
          <div class="wa-logo">💬</div>
          <div class="wa-content">
            <div class="wa-from">TRIMLY · {{ b.shopName }}</div>
            <div class="wa-msg">
              @if (b.status === 'CONFIRMED') {
                ✅ Your booking for <b>{{ b.servicesSnapshot }}</b> on <b>{{ b.bookingDate }} at {{ b.slotTime }}</b> has been confirmed by {{ b.shopName }}. See you then!
              } @else if (b.status === 'PENDING') {
                ⏳ Your booking request for <b>{{ b.servicesSnapshot }}</b> on <b>{{ b.bookingDate }} at {{ b.slotTime }}</b> is waiting for barber confirmation.
              } @else if (b.status === 'REJECTED') {
                ❌ Your booking for <b>{{ b.servicesSnapshot }}</b> was declined. Please book another slot.
              } @else if (b.rescheduleStatus === 'PENDING') {
                🔄 {{ b.shopName }} wants to reschedule your booking to <b>{{ b.rescheduleDate }} at {{ b.rescheduleTime }}</b>. {{ b.rescheduleReason ? 'Reason: ' + b.rescheduleReason : '' }}
              }
            </div>
            @if (b.rescheduleStatus === 'PENDING') {
              <div style="display:flex;gap:8px;margin-top:10px">
                <button class="btn btn-emerald btn-sm" (click)="respond(b.id, true)">✓ Accept</button>
                <button class="btn btn-crimson btn-sm" (click)="respond(b.id, false)">✕ Decline</button>
              </div>
            }
            <div class="wa-time">{{ relTime(b.createdAt) }}</div>
          </div>
        </div>
      }

      @if (active().length === 0) {
        <div class="empty">
          <div class="ei">🔔</div>
          <div class="et">All caught up! No new notifications.</div>
        </div>
      }
    </div>
  `
})
export class CustomerNotificationsComponent {
  @Input() bookings: BookingResponse[] = [];
  @Output() action = new EventEmitter<void>();

  bookSvc = inject(BookingService);
  toast = inject(ToastService);

  active() {
    return this.bookings.filter(b =>
      ['PENDING','CONFIRMED','REJECTED'].includes(b.status) || b.rescheduleStatus === 'PENDING'
    );
  }

  respond(id: number, accept: boolean) {
    this.bookSvc.respondReschedule(id, accept).subscribe({
      next: () => { this.toast.ok(accept ? 'Reschedule accepted ✅' : 'Declined'); this.action.emit(); },
      error: e => this.toast.err('Failed', e.error?.message)
    });
  }

  relTime(ts: string): string {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  }
}
