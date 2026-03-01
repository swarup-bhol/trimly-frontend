import { Component, Input, Output, EventEmitter, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShopService } from '../../../core/services/shop.service';
import { BookingService } from '../../../core/services/booking.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { ShopResponse, ServiceResponse, SlotInfo } from '../../../core/models/models';

@Component({
  selector: 'app-booking-flow',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="min-height:100vh;background:var(--bg)">
      <nav style="display:flex;align-items:center;gap:16px;padding:0 24px;height:58px;border-bottom:1px solid var(--border);background:rgba(9,9,14,.95);position:sticky;top:0;z-index:100;backdrop-filter:blur(20px)">
        <button class="btn btn-ghost btn-sm" (click)="back.emit()">← Back</button>
        <div style="font-family:'Unbounded',sans-serif;font-size:14px;font-weight:700">{{ shop()?.shopName || 'Book Appointment' }}</div>
      </nav>

      <div style="max-width:640px;margin:0 auto;padding:28px 20px">

        @if (step() === 0 && !success()) { <!-- Shop preview -->
          <div class="anim-fade-up">
            @if (shop()) {
              <div style="border-radius:20px;overflow:hidden;border:1px solid var(--border);margin-bottom:20px">
                <div [style.background]="'linear-gradient(135deg,' + (shop()!.color1 || '#1a1200') + ',' + (shop()!.color2 || '#0d0d1a') + ')'"
                  style="height:120px;display:flex;align-items:center;justify-content:center;font-size:64px">
                  {{ shop()!.emoji || '✂️' }}
                </div>
                <div style="padding:20px">
                  <div style="font-family:'Unbounded',sans-serif;font-size:22px;font-weight:700;margin-bottom:4px">{{ shop()!.shopName }}</div>
                  <div style="color:var(--text2);font-size:13px;margin-bottom:12px">📍 {{ shop()!.location }}</div>
                  @if (shop()!.bio) { <div style="font-size:13px;color:var(--text2);line-height:1.7;margin-bottom:12px">{{ shop()!.bio }}</div> }
                  <div style="display:flex;gap:8px;flex-wrap:wrap">
                    @if (shop()!.avgRating) {
                      <span class="badge by">★ {{ shop()!.avgRating | number:'1.1-1' }} ({{ shop()!.totalReviews }})</span>
                    }
                    <span class="badge" [class]="shop()!.open ? 'bg' : 'br'">{{ shop()!.open ? '● Open' : '● Closed' }}</span>
                    <span class="badge bm">💺 {{ shop()!.seats }} seats</span>
                  </div>
                </div>
              </div>
              <button class="btn btn-amber btn-block btn-lg" (click)="step.set(1)">Book Here →</button>
            }
          </div>
        }

        @if (step() > 0 && !success()) {
          <!-- Steps indicator -->
          <div class="steps" style="margin-bottom:28px">
            @for (s of steps; track s.n; let i = $index) {
              <div class="step-n">
                <div class="step-c" [class.done]="step()>s.n" [class.active]="step()===s.n" [class.todo]="step()<s.n">
                  {{ step() > s.n ? '✓' : s.n }}
                </div>
                <div class="step-l" [class.done]="step()>s.n" [class.active]="step()===s.n" [class.todo]="step()<s.n">{{ s.label }}</div>
              </div>
              @if (i < steps.length-1) {
                <div class="step-line" [class.done]="step()>s.n"></div>
              }
            }
          </div>

          <!-- Step 1: Services -->
          @if (step() === 1) {
            <div class="anim-fade-up">
              <div style="margin-bottom:16px;font-family:'Unbounded',sans-serif;font-size:16px;font-weight:700">Choose Services</div>
              @for (svc of enabledServices(); track svc.id) {
                <div class="svc" [style.border-color]="selected().has(svc.id) ? 'var(--amber)' : ''" [style.background]="selected().has(svc.id) ? 'var(--amber-dim)' : ''"
                  (click)="toggleSvc(svc.id)" style="cursor:pointer">
                  <div class="svc-ico">{{ svc.icon || '✂️' }}</div>
                  <div class="svc-info">
                    <div class="svc-name">{{ svc.serviceName }}</div>
                    <div class="svc-meta">⏱ {{ svc.durationMinutes }} min</div>
                  </div>
                  <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
                    <div class="svc-price">₹{{ svc.price }}</div>
                    @if (selected().has(svc.id)) { <span style="font-size:16px">✓</span> }
                  </div>
                </div>
              }
              @if (selected().size > 0) {
                <div class="sbox" style="margin-top:16px">
                  <div style="font-size:12px;color:var(--text2);margin-bottom:6px">Selected:</div>
                  <div style="font-weight:700">{{ selectedNames() }}</div>
                  <div style="color:var(--text2);font-size:12px;margin-top:4px">Total ⏱ {{ totalDuration() }} min</div>
                  <div style="font-family:'Unbounded',sans-serif;font-size:24px;font-weight:700;color:var(--amber);margin-top:8px">₹{{ totalPrice() }}</div>
                </div>
                <button class="btn btn-amber btn-block btn-lg" style="margin-top:12px" (click)="step.set(2)">
                  Continue →
                </button>
              }
            </div>
          }

          <!-- Step 2: Date + Slot -->
          @if (step() === 2) {
            <div class="anim-fade-up">
              <div style="margin-bottom:16px;font-family:'Unbounded',sans-serif;font-size:16px;font-weight:700">Pick a Date & Time</div>

              <!-- Date selector -->
              <div style="display:flex;gap:10px;margin-bottom:20px">
                @for (d of dateOptions; track d.label; let i = $index) {
                  <div (click)="selDateIdx.set(i); selSlot.set(null); loadSlots()"
                    style="flex:1;text-align:center;padding:14px 8px;border-radius:12px;cursor:pointer;border:2px solid;transition:all .15s"
                    [style.border-color]="selDateIdx() === i ? 'var(--amber)' : 'var(--border)'"
                    [style.background]="selDateIdx() === i ? 'var(--amber-dim)' : 'var(--card)'">
                    <div style="font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">{{ d.label }}</div>
                    <div style="font-family:'Unbounded',sans-serif;font-size:22px;font-weight:700" [style.color]="selDateIdx() === i ? 'var(--amber)' : 'var(--text)'">{{ d.day }}</div>
                    <div style="font-size:11px;color:var(--text2)">{{ d.month }}</div>
                  </div>
                }
              </div>

              @if (slotsLoading()) {
                <div class="empty" style="padding:20px"><div class="et">Loading slots...</div></div>
              } @else {
                <div class="slot-grid">
                  @for (sl of slots(); track sl.label) {
                    <div class="slot"
                      [class.s-sel]="selSlot() === sl.label"
                      [class.s-off]="sl.taken || !sl.available"
                      (click)="!sl.taken && sl.available && selSlot.set(sl.label)">
                      {{ sl.label }}
                      @if (sl.seatsLeft > 0 && sl.seatsLeft < (shop()?.seats || 0)) {
                        <div style="font-size:9px;color:var(--amber);margin-top:2px">{{ sl.seatsLeft }} left</div>
                      }
                    </div>
                  }
                </div>
              }

              @if (selSlot()) {
                <button class="btn btn-amber btn-block btn-lg" style="margin-top:20px" (click)="step.set(3)">
                  Confirm Time →
                </button>
              }
            </div>
          }

          <!-- Step 3: Confirm -->
          @if (step() === 3) {
            <div class="anim-fade-up">
              <div style="margin-bottom:16px;font-family:'Unbounded',sans-serif;font-size:16px;font-weight:700">Confirm Booking</div>

              <div class="sbox">
                <div class="srow"><span style="color:var(--text2)">Shop</span><span style="font-weight:600">{{ shop()!.shopName }}</span></div>
                <div class="srow"><span style="color:var(--text2)">Services</span><span style="font-weight:600;text-align:right;max-width:60%">{{ selectedNames() }}</span></div>
                <div class="srow"><span style="color:var(--text2)">Date</span><span style="font-weight:600">{{ dateOptions[selDateIdx()].fullDate }}</span></div>
                <div class="srow"><span style="color:var(--text2)">Time</span><span style="font-weight:600">{{ selSlot() }}</span></div>
                <div class="srow"><span style="color:var(--text2)">Duration</span><span>~{{ totalDuration() }} min</span></div>
                <div class="srow"><span style="color:var(--text2)">Name</span><span style="font-weight:600">{{ auth.user()?.fullName }}</span></div>
                <div class="srow"><span style="color:var(--text2)">Total</span><div class="stotal">₹{{ totalPrice() }}</div></div>
              </div>

              <div style="margin-top:14px;padding:12px 14px;background:rgba(37,211,102,0.05);border:1px solid rgba(37,211,102,0.15);border-radius:10px;font-size:12px;color:var(--text2)">
                💬 You'll get a WhatsApp confirmation when the barber accepts your booking. Pay at the shop.
              </div>

              <button class="btn btn-amber btn-block btn-lg" style="margin-top:16px" [disabled]="booking()" (click)="confirmBooking()">
                {{ booking() ? 'Booking...' : '🎯 Confirm Booking' }}
              </button>
              <button class="btn btn-ghost btn-block" style="margin-top:8px" (click)="step.set(2)">← Change slot</button>
            </div>
          }
        }

        <!-- Success -->
        @if (success()) {
          <div class="anim-fade-up" style="text-align:center;padding:40px 20px">
            <div style="font-size:72px;margin-bottom:16px;animation:popIn .5s">🎉</div>
            <div style="font-family:'Unbounded',sans-serif;font-size:28px;font-weight:900;margin-bottom:8px">BOOKED!</div>
            <div style="color:var(--text2);margin-bottom:24px;line-height:1.7">
              Your appointment at <b>{{ shop()?.shopName }}</b> is confirmed.<br/>
              We'll notify you on WhatsApp when the barber accepts.
            </div>
            <div class="sbox" style="text-align:left;margin-bottom:20px">
              <div class="srow"><span style="color:var(--text2)">Services</span><span>{{ selectedNames() }}</span></div>
              <div class="srow"><span style="color:var(--text2)">When</span><span>{{ dateOptions[selDateIdx()].fullDate }} at {{ selSlot() }}</span></div>
              <div class="srow"><span style="color:var(--text2)">Amount</span><div class="stotal">₹{{ totalPrice() }}</div></div>
            </div>
            <div style="background:linear-gradient(135deg,#1a2e1a,#0f1f0f);border:1px solid rgba(37,211,102,0.2);border-radius:12px;padding:14px;margin-bottom:20px">
              <div style="font-size:11px;font-weight:700;color:#25d366;margin-bottom:4px">💬 WHATSAPP</div>
              <div style="font-size:13px">Confirmation message sent to your WhatsApp</div>
            </div>
            <button class="btn btn-amber btn-block btn-lg" (click)="done.emit(true)">View My Bookings →</button>
          </div>
        }

      </div>
    </div>
  `
})
export class BookingFlowComponent implements OnInit {
  @Input() shopId!: number;
  @Output() done = new EventEmitter<boolean>();
  @Output() back = new EventEmitter<void>();

  shopSvc = inject(ShopService);
  bookSvc = inject(BookingService);
  toast = inject(ToastService);
  auth = inject(AuthService);

  shop = signal<ShopResponse | null>(null);
  step = signal(0);
  selected = signal<Set<number>>(new Set());
  slots = signal<SlotInfo[]>([]);
  selSlot = signal<string | null>(null);
  selDateIdx = signal(0);
  slotsLoading = signal(false);
  booking = signal(false);
  success = signal(false);

  steps = [
    { n: 1, label: 'Services' },
    { n: 2, label: 'Date & Time' },
    { n: 3, label: 'Confirm' },
  ];

  dateOptions = this.buildDates();

  ngOnInit() {
    this.shopSvc.getShopById(this.shopId).subscribe({
      next: r => { this.shop.set(r.data); this.step.set(1); },
      error: () => this.back.emit()
    });
  }

  buildDates() {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return [0, 1, 2].map(offset => {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      return {
        label: offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : days[d.getDay()],
        day: d.getDate(),
        month: months[d.getMonth()],
        fullDate: `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`,
        iso: d.toISOString().split('T')[0]
      };
    });
  }

  enabledServices() {
    return (this.shop()?.services || []).filter(s => s.enabled);
  }

  toggleSvc(id: number) {
    const s = new Set(this.selected());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selected.set(s);
  }

  selectedNames() {
    return (this.shop()?.services || [])
      .filter(s => this.selected().has(s.id))
      .map(s => s.serviceName).join(' + ');
  }

  totalDuration() {
    return (this.shop()?.services || [])
      .filter(s => this.selected().has(s.id))
      .reduce((sum, s) => sum + s.durationMinutes, 0);
  }

  totalPrice() {
    return (this.shop()?.services || [])
      .filter(s => this.selected().has(s.id))
      .reduce((sum, s) => sum + s.price, 0);
  }

  loadSlots() {
    if (!this.shop()) return;
    this.slotsLoading.set(true);
    const date = this.dateOptions[this.selDateIdx()].iso;
    this.shopSvc.getSlots(this.shopId, date).subscribe({
      next: r => { this.slots.set(r.data?.slots || []); this.slotsLoading.set(false); },
      error: () => this.slotsLoading.set(false)
    });
  }

  confirmBooking() {
    if (!this.selSlot() || this.selected().size === 0) return;
    this.booking.set(true);

    // Convert "9:30 AM" → "09:30"
    const [time, ampm] = this.selSlot()!.split(' ');
    const [h, m] = time.split(':').map(Number);
    const hour = ampm === 'PM' && h !== 12 ? h + 12 : (ampm === 'AM' && h === 12 ? 0 : h);
    const slotTime = `${String(hour).padStart(2,'0')}:${String(m).padStart(2,'0')}`;

    this.bookSvc.createBooking({
      shopId: this.shopId,
      serviceIds: Array.from(this.selected()),
      bookingDate: this.dateOptions[this.selDateIdx()].iso,
      slotTime,
      seats: 1
    }).subscribe({
      next: () => { this.booking.set(false); this.success.set(true); },
      error: e => {
        this.booking.set(false);
        this.toast.err('Booking failed', e.error?.message || 'Please try again');
      }
    });
  }
}
