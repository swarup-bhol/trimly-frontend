import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { NotificationService } from '../../core/services/notification.service';
import { Shop, Service, Booking, SlotInfo, Notification } from '../../core/models/models';

type CustomerTab = 'explore' | 'booking' | 'mybookings' | 'notifications';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
<div style="display:flex;flex-direction:column;min-height:100vh">
  <!-- TOPBAR -->
  <header class="topbar">
    <div class="topbar-brand">TRIM<span class="sub-brand">LY</span></div>
    <div class="topbar-right">
      <button class="notif-btn" (click)="tab.set('notifications')">
        🔔
        @if (unreadCount() > 0) { <div class="notif-dot"></div> }
      </button>
      <div class="user-pill">
        <div class="up-av">{{ initials() }}</div>
        <div><div class="up-name">{{ session()?.name }}</div><div class="up-role">Customer</div></div>
      </div>
      <button class="btn btn-ghost btn-sm" (click)="logout()">Logout</button>
    </div>
  </header>

  <div class="main">
    <!-- SIDEBAR -->
    <aside class="sidebar">
      <div class="sb-sec">Menu</div>
      @for (n of navItems; track n.id) {
        <button class="sb-item" [class.on]="tab() === n.id" (click)="switchTab(n.id)">
          <span>{{ n.icon }}</span> {{ n.label }}
          @if (n.badge && n.badge > 0) { <span class="sb-badge">{{ n.badge }}</span> }
        </button>
      }
    </aside>

    <main class="main-content">
      @switch (tab()) {
        @case ('explore') { <ng-container *ngTemplateOutlet="exploreTpl"></ng-container> }
        @case ('booking') { <ng-container *ngTemplateOutlet="bookingTpl"></ng-container> }
        @case ('mybookings') { <ng-container *ngTemplateOutlet="myBookingsTpl"></ng-container> }
        @case ('notifications') { <ng-container *ngTemplateOutlet="notifsTpl"></ng-container> }
      }
    </main>
  </div>

  <!-- MOBILE NAV -->
  <nav class="mobile-nav">
    @for (n of navItems; track n.id) {
      <button class="mn-item" [class.on]="tab() === n.id" (click)="switchTab(n.id)">
        <span class="mn-icon">{{ n.icon }} @if(n.badge&&n.badge>0){<span class="mn-badge">{{n.badge}}</span>}</span>
        {{ n.label }}
      </button>
    }
  </nav>
</div>

<!-- EXPLORE TAB -->
<ng-template #exploreTpl>
  <div class="page">
    <div class="ph">
      <div class="ph-title">FIND A BARBER</div>
      <div class="ph-sub">Browse shops, pick a slot, walk in fresh ✂️</div>
    </div>
    @if (loadingShops()) {
      <div class="loading-overlay"><div class="spinner"></div><span>Finding nearby barbers...</span></div>
    } @else if (shops().length === 0) {
      <div class="empty"><div class="ei">🏪</div><div class="et">No active shops found. Check back soon!</div></div>
    } @else {
      <div class="g3">
        @for (shop of shops(); track shop.id) {
          <div class="shop-card" [class.closed]="!shop.isOpen" (click)="startBooking(shop)">
            <div class="sc-banner" [style.background]="'linear-gradient(135deg,' + (shop.color1||'#1a1200') + ',' + (shop.color2||'#0d0d1a') + ')'">
              <span class="sc-emoji">{{ shop.emoji || '✂️' }}</span>
            </div>
            <div class="sc-body">
              <div class="sc-name">{{ shop.shopName }}</div>
              <div class="sc-loc">📍 {{ shop.location }}</div>
              <div class="sc-pills">
                @for (svc of shop.services.slice(0,3); track svc.id) {
                  <span class="sc-pill">{{ svc.name }}</span>
                }
                @if (shop.services.length > 3) { <span class="sc-pill">+{{ shop.services.length - 3 }} more</span> }
              </div>
              <div class="sc-foot">
                <div class="stars">
                  @if (shop.rating) {
                    @for (s of [1,2,3,4,5]; track s) { <span [class.star-empty]="s > (shop.rating||0)">★</span> }
                    <span style="font-size:11px;color:var(--text3);margin-left:4px">({{ shop.reviews }})</span>
                  } @else {
                    <span style="font-size:11px;color:var(--text3)">New shop</span>
                  }
                </div>
                <span [class]="shop.isOpen ? 'open-badge ob-open' : 'open-badge ob-closed'">{{ shop.isOpen ? '● Open' : '● Closed' }}</span>
              </div>
            </div>
          </div>
        }
      </div>
    }
  </div>
</ng-template>

<!-- BOOKING TAB (multi-step) -->
<ng-template #bookingTpl>
  <div class="page" style="max-width:640px">
    @if (!selectedShop()) {
      <div class="page"><div class="empty"><div class="ei">🏪</div><div class="et">Select a shop from Explore to book</div><button class="btn btn-amber" style="margin-top:16px" (click)="tab.set('explore')">Browse Shops →</button></div></div>
    } @else if (bookingSuccess()) {
      <!-- SUCCESS PAGE -->
      <div class="card card-amber" style="margin-top:32px">
        <div style="text-align:center;padding:24px 0 16px">
          <div style="font-size:72px;animation:popIn 0.5s cubic-bezier(0.22,1,0.36,1)">🎉</div>
          <div style="font-family:'Unbounded',sans-serif;font-size:32px;font-weight:900;color:var(--amber);margin:14px 0 8px">BOOKING SENT!</div>
          <div style="color:var(--text2);font-size:14px;max-width:320px;margin:0 auto 24px;line-height:1.7">
            Your request is with <strong>{{ selectedShop()!.shopName }}</strong>. They've been notified and will confirm shortly.
          </div>
          <div style="background:rgba(16,217,138,0.07);border:1px solid rgba(16,217,138,0.22);border-radius:12px;padding:14px 16px;margin-bottom:18px;display:flex;gap:12px;align-items:center;text-align:left">
            <div style="width:44px;height:44px;border-radius:12px;background:rgba(16,217,138,0.12);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">🔔</div>
            <div>
              <div style="font-weight:700;font-size:13px;color:var(--emerald);margin-bottom:3px">Barber Notified In-App ✓</div>
              <div style="font-size:12px;color:var(--text2);line-height:1.6">{{ selectedShop()!.ownerName }} received your request. You'll get a notification here when they respond.</div>
            </div>
          </div>
          @if (bookingSuccess()) {
            <div class="sbox" style="text-align:left;margin-bottom:20px">
              <div class="srow"><span style="color:var(--text2)">Booking ID</span><span style="font-family:monospace;font-size:12px;color:var(--sky)">#{{ bookingSuccess()!.id }}</span></div>
              <div class="srow"><span style="color:var(--text2)">Shop</span><span>{{ selectedShop()!.emoji || '✂️' }} {{ selectedShop()!.shopName }}</span></div>
              <div class="srow"><span style="color:var(--text2)">Service</span><span>{{ bookingSuccess()!.servicesLabel }}</span></div>
              <div class="srow"><span style="color:var(--text2)">Slot</span><span>{{ bookingSuccess()!.bookingDate }} · {{ bookingSuccess()!.slot }}</span></div>
              <div class="srow"><span style="color:var(--text2)">Duration</span><span>{{ bookingSuccess()!.duration }} min</span></div>
              <div class="srow"><span style="font-weight:700">Amount</span><span class="stotal">₹{{ bookingSuccess()!.amount }}</span></div>
            </div>
          }
          <button class="btn btn-amber btn-block btn-lg" (click)="resetBooking()">← Book Another</button>
        </div>
      </div>
    } @else {
      <!-- BOOKING STEPS -->
      <div class="ph">
        <div class="ph-bc">Booking · <span class="ph-bc-cur">{{ selectedShop()!.shopName }}</span></div>
        <div class="ph-title">BOOK APPOINTMENT</div>
      </div>

      <!-- STEP INDICATORS -->
      <div class="steps">
        @for (step of steps; track step.n; let i = $index) {
          <div class="step-n">
            <div class="step-c" [class.done]="bookingStep() > step.n" [class.active]="bookingStep() === step.n" [class.todo]="bookingStep() < step.n">
              @if (bookingStep() > step.n) { ✓ } @else { {{ step.n }} }
            </div>
            <span class="step-l" [class.done]="bookingStep() > step.n" [class.active]="bookingStep() === step.n" [class.todo]="bookingStep() < step.n">{{ step.label }}</span>
          </div>
          @if (i < steps.length - 1) { <div class="step-line" [class.done]="bookingStep() > step.n"></div> }
        }
      </div>

      <!-- STEP 1: SELECT SERVICES -->
      @if (bookingStep() === 1) {
        <div class="card" style="margin-bottom:16px">
          <div class="ch"><div class="ct">Select Services</div><span style="font-size:12px;color:var(--text3)">{{ selectedServices().length }} selected</span></div>
          @for (svc of selectedShop()!.services; track svc.id) {
            @if (svc.enabled) {
              <div class="svc" [style.border-color]="isSelected(svc.id) ? 'var(--amber)' : ''" [style.background]="isSelected(svc.id) ? 'rgba(245,166,35,0.04)' : ''" (click)="toggleSvc(svc)">
                <div class="svc-ico">{{ svc.icon || '✂️' }}</div>
                <div class="svc-body"><div class="svc-name">{{ svc.name }}</div><div class="svc-meta">⏱ {{ svc.duration }}min{{ svc.description ? ' · ' + svc.description : '' }}</div></div>
                <div class="svc-price">₹{{ svc.price }}</div>
                <div style="margin-left:12px;font-size:20px">{{ isSelected(svc.id) ? '✅' : '○' }}</div>
              </div>
            }
          }
        </div>
        @if (selectedServices().length > 0) {
          <div class="sbox" style="margin-bottom:16px">
            <div class="srow"><span style="color:var(--text2)">Services</span><span>{{ selectedServiceNames() }}</span></div>
            <div class="srow"><span style="color:var(--text2)">Duration</span><span>{{ totalDuration() }} min</span></div>
            <div class="srow"><span style="font-weight:700">Total</span><span class="stotal">₹{{ totalAmount() }}</span></div>
          </div>
        }
        <button class="btn btn-amber btn-block" [disabled]="selectedServices().length === 0" (click)="bookingStep.set(2)">Next: Choose Slot →</button>
      }

      <!-- STEP 2: PICK SLOT -->
      @if (bookingStep() === 2) {
        <div class="card" style="margin-bottom:16px">
          <div class="ch"><div class="ct">Choose Your Slot</div></div>
          <div class="fg"><label class="fl">Date</label><input class="fi" type="date" [(ngModel)]="selectedDate" [min]="today" (change)="loadSlots()" /></div>
          @if (loadingSlots()) {
            <div style="text-align:center;padding:20px"><div class="spinner"></div></div>
          } @else {
            <div class="slot-grid">
              @for (slot of slots(); track slot.id) {
                <button class="slot" [class.s-sel]="selectedSlot?.id === slot.id" [class.s-off]="slot.taken" [class.s-dis]="slot.disabled"
                  [disabled]="slot.taken || slot.disabled" (click)="selectSlot(slot)">
                  {{ slot.label }}
                </button>
              }
            </div>
          }
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-outline" (click)="bookingStep.set(1)">← Back</button>
          <button class="btn btn-amber" style="flex:1" [disabled]="!selectedSlot" (click)="bookingStep.set(3)">Next: Confirm →</button>
        </div>
      }

      <!-- STEP 3: CONFIRM -->
      @if (bookingStep() === 3) {
        <div class="card" style="margin-bottom:16px">
          <div class="ch"><div class="ct">Confirm Booking</div></div>
          <div class="sbox" style="margin-bottom:20px">
            <div class="srow"><span style="color:var(--text2)">Shop</span><span>{{ selectedShop()!.emoji || '✂️' }} {{ selectedShop()!.shopName }}</span></div>
            <div class="srow"><span style="color:var(--text2)">Services</span><span>{{ selectedServiceNames() }}</span></div>
            <div class="srow"><span style="color:var(--text2)">Slot</span><span>{{ selectedDate }} · {{ selectedSlot?.label }}</span></div>
            <div class="srow"><span style="color:var(--text2)">Duration</span><span>{{ totalDuration() }} min</span></div>
            <div class="srow"><span style="font-weight:700">Total</span><span class="stotal">₹{{ totalAmount() }}</span></div>
          </div>
          <div class="fg"><label class="fl">Your Name</label><input class="fi" [(ngModel)]="customerName" /></div>
          <div class="fg"><label class="fl">Phone</label><input class="fi" [(ngModel)]="customerPhone" /></div>
        </div>
        @if (bookingErr()) { <div class="err-banner" style="margin-bottom:12px">{{ bookingErr() }}</div> }
        <div style="display:flex;gap:10px">
          <button class="btn btn-outline" (click)="bookingStep.set(2)">← Back</button>
          <button class="btn btn-amber" style="flex:1" [disabled]="submittingBooking()" (click)="submitBooking()">
            @if (submittingBooking()) { <span class="spinner" style="width:16px;height:16px;border-width:2px"></span> }
            {{ submittingBooking() ? 'Booking...' : 'Confirm Booking →' }}
          </button>
        </div>
      }
    }
  </div>
</ng-template>

<!-- MY BOOKINGS TAB -->
<ng-template #myBookingsTpl>
  <div class="page">
    <div class="ph"><div class="ph-title">MY BOOKINGS</div><div class="ph-sub">Your appointment history</div></div>
    @if (loadingMyBookings()) {
      <div class="loading-overlay"><div class="spinner"></div><span>Loading bookings...</span></div>
    } @else if (myBookings().length === 0) {
      <div class="empty"><div class="ei">📋</div><div class="et">No bookings yet. Book your first appointment!</div><button class="btn btn-amber" style="margin-top:16px" (click)="tab.set('explore')">Browse Shops →</button></div>
    } @else {
      @for (b of myBookings(); track b.id) {
        <div class="pb-card">
          <div class="pb-ico">{{ b.shopEmoji || '✂️' }}</div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;font-size:14px;margin-bottom:2px">{{ b.shopName }}</div>
            <div style="font-size:12px;color:var(--text2);margin-bottom:6px">✂️ {{ b.servicesLabel }} · 🕐 {{ b.slot }} · ⏱ {{ b.duration }}min</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
              <span class="badge" [class]="statusClass(b.status)">{{ statusLabel(b.status) }}</span>
              <span class="badge bm">₹{{ b.amount }}</span>
              @if (b.status === 'PENDING') { <span style="font-size:11px;color:var(--amber)">⏳ Awaiting barber confirmation</span> }
              @if (b.status === 'CONFIRMED') { <span style="font-size:11px;color:var(--emerald)">✓ Walk in at {{ b.slot }}</span> }
            </div>
            @if (b.status === 'COMPLETED' && !b.rating) {
              <div style="margin-top:10px">
                <div style="font-size:11px;color:var(--text3);margin-bottom:5px">Rate your experience:</div>
                <div style="display:flex;gap:4px">
                  @for (s of [1,2,3,4,5]; track s) {
                    <button style="background:none;border:none;cursor:pointer;font-size:20px;color:var(--border2);transition:color .15s"
                      (click)="rateBooking(b.id, s)" (mouseenter)="hoverRating=s" (mouseleave)="hoverRating=0"
                      [style.color]="s <= hoverRating ? 'var(--amber)' : 'var(--border2)'">★</button>
                  }
                </div>
              </div>
            }
            @if (b.rating && b.rating > 0) {
              <div style="margin-top:8px;display:flex;gap:3px">
                @for (s of [1,2,3,4,5]; track s) { <span [style.color]="s<=b.rating! ? 'var(--amber)' : 'var(--border2)'">★</span> }
                <span style="font-size:11px;color:var(--text3);margin-left:6px">Your rating</span>
              </div>
            }
            @if (b.status === 'PENDING' || b.status === 'CONFIRMED') {
              <button class="btn btn-crimson btn-sm" style="margin-top:10px" (click)="cancelBooking(b.id)">Cancel</button>
            }
          </div>
        </div>
      }
    }
  </div>
</ng-template>

<!-- NOTIFICATIONS TAB -->
<ng-template #notifsTpl>
  <div class="page">
    <div class="ph">
      <div class="ph-row">
        <div><div class="ph-title">NOTIFICATIONS</div><div class="ph-sub">Updates on your bookings</div></div>
        @if (hasUnreadNotifications()) {
          <button class="btn btn-ghost-amber btn-sm" (click)="markAllRead()">Mark all read</button>
        }
      </div>
    </div>
    @if (notifications().length === 0) {
      <div class="empty"><div class="ei">🔔</div><div class="et">No notifications yet. Book an appointment to get started!</div></div>
    }
    @for (n of notifications(); track n.id) {
      <div (click)="markRead(n.id)"
           [style.background]="n.isRead ? 'var(--card)' : 'rgba(245,166,35,0.04)'"
           [style.border]="'1px solid ' + (n.isRead ? 'var(--border)' : 'rgba(245,166,35,0.2)')"
           style="display:flex;gap:14px;align-items:flex-start;padding:16px 20px;margin-bottom:8px;border-radius:14px;cursor:pointer;transition:all .2s">
        <div [style.background]="notifBg(n.type)" style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">
          {{ notifIcon(n.type) }}
        </div>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:3px">
            <div style="font-weight:700;font-size:14px" [style.color]="n.isRead ? 'var(--text)' : notifColor(n.type)">{{ n.title }}</div>
            @if (!n.isRead) { <span style="width:8px;height:8px;border-radius:50%;background:var(--amber);display:inline-block"></span> }
          </div>
          <div style="font-size:13px;color:var(--text2);line-height:1.55">{{ n.body }}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:5px">{{ timeAgo(n.createdAt) }}</div>
        </div>
      </div>
    }
  </div>
</ng-template>
  `
})
export class CustomerComponent implements OnInit {
  private api = inject(ApiService);
  private authSvc = inject(AuthService);
  private toast = inject(ToastService);
  private notifSvc = inject(NotificationService);
  private route = inject(ActivatedRoute);

  tab = signal<CustomerTab>('explore');
  shops = signal<Shop[]>([]);
  selectedShop = signal<Shop | null>(null);
  loadingShops = signal(true);
  bookingStep = signal(1);
  slots = signal<SlotInfo[]>([]);
  loadingSlots = signal(false);
  selectedServices = signal<Service[]>([]);
  selectedSlot: SlotInfo | null = null;
  selectedDate = new Date().toISOString().split('T')[0];
  today = new Date().toISOString().split('T')[0];
  customerName = '';
  customerPhone = '';
  submittingBooking = signal(false);
  bookingErr = signal<string | null>(null);
  bookingSuccess = signal<Booking | null>(null);
  myBookings = signal<Booking[]>([]);
  loadingMyBookings = signal(false);
  notifications = signal<Notification[]>([]);
  hoverRating = 0;

  session = this.authSvc.session;
  unreadCount = this.notifSvc.unreadCount;
  initials = computed(() => this.session()?.name?.charAt(0)?.toUpperCase() ?? 'C');

  steps = [{ n: 1, label: 'Services' }, { n: 2, label: 'Slot' }, { n: 3, label: 'Confirm' }];


  hasUnreadNotifications = computed(() =>
    this.notifications().some(n => !n.isRead)
  );

  get navItems() {
    const unread = this.notifications().filter(n => !n.isRead).length;
    return [
      { id: 'explore' as CustomerTab, icon: '🔍', label: 'Explore', badge: 0 },
      { id: 'mybookings' as CustomerTab, icon: '📋', label: 'My Bookings', badge: 0 },
      { id: 'notifications' as CustomerTab, icon: '🔔', label: 'Notifications', badge: unread }
    ];
  }

  selectedServiceNames = computed(() => this.selectedServices().map(s => s.name).join(', '));
  totalDuration = computed(() => this.selectedServices().reduce((s, x) => s + x.duration, 0));
  totalAmount = computed(() => this.selectedServices().reduce((s, x) => s + x.price, 0));

  ngOnInit(): void {
    // Pre-fill customer info from session
    const sess = this.session();
    if (sess) { this.customerName = sess.name; }

    this.loadShops();
    this.loadMyBookings();
    this.loadNotifications();

    // Handle deep link ?shop=ID
    this.route.queryParams.subscribe(params => {
      if (params['shop']) {
        this.api.get<Shop>(`/shops/public/${params['shop']}`).subscribe({
          next: shop => { this.startBooking(shop); },
          error: () => {}
        });
      }
    });
  }

  loadShops(): void {
    this.loadingShops.set(true);
    this.api.get<Shop[]>('/shops/public').subscribe({
      next: s => { this.shops.set(s); this.loadingShops.set(false); },
      error: () => this.loadingShops.set(false)
    });
  }

  loadMyBookings(): void {
    this.loadingMyBookings.set(true);
    this.api.get<Booking[]>('/bookings/my').subscribe({
      next: b => { this.myBookings.set(b); this.loadingMyBookings.set(false); },
      error: () => this.loadingMyBookings.set(false)
    });
  }

  loadNotifications(): void {
    this.api.get<Notification[]>('/notifications').subscribe({ next: n => this.notifications.set(n) });
  }

  switchTab(id: CustomerTab): void {
    this.tab.set(id);
    if (id === 'mybookings') this.loadMyBookings();
    if (id === 'notifications') this.loadNotifications();
  }

  startBooking(shop: Shop): void {
    this.selectedShop.set(shop);
    this.selectedServices.set([]);
    this.selectedSlot = null;
    this.bookingStep.set(1);
    this.bookingSuccess.set(null);
    this.bookingErr.set(null);
    this.tab.set('booking');
    this.loadSlots();
  }

  loadSlots(): void {
    const shop = this.selectedShop();
    if (!shop) return;
    this.loadingSlots.set(true);
    this.api.get<SlotInfo[]>(`/shops/${shop.id}/slots`, { date: this.selectedDate }).subscribe({
      next: s => { this.slots.set(s); this.loadingSlots.set(false); },
      error: () => this.loadingSlots.set(false)
    });
  }

  isSelected(id: number): boolean { return this.selectedServices().some(s => s.id === id); }

  toggleSvc(svc: Service): void {
    this.selectedServices.update(sel => sel.some(s => s.id === svc.id) ? sel.filter(s => s.id !== svc.id) : [...sel, svc]);
  }

  selectSlot(slot: SlotInfo): void { this.selectedSlot = slot; }

  submitBooking(): void {
    this.bookingErr.set(null);
    if (!this.customerName.trim()) { this.bookingErr.set('Please enter your name'); return; }
    const shop = this.selectedShop()!;
    const svcs = this.selectedServices();
    const slot = this.selectedSlot!;

    this.submittingBooking.set(true);
    this.api.post<Booking>('/bookings', {
      shopId: shop.id,
      serviceIds: svcs.map(s => s.id),
      slot: slot.label,
      slotId: slot.id,
      bookingDate: this.selectedDate,
      customerName: this.customerName.trim(),
      customerPhone: this.customerPhone.trim()
    }).subscribe({
      next: booking => {
        this.submittingBooking.set(false);
        this.bookingSuccess.set(booking);
        this.loadMyBookings();
        this.notifSvc.refreshCount();
        this.toast.show('Booking sent! 🎉', 'Awaiting barber confirmation', 'ok');
      },
      error: (e) => {
        this.submittingBooking.set(false);
        this.bookingErr.set(e.error?.message || 'Booking failed. Slot may have been taken.');
      }
    });
  }

  resetBooking(): void { this.bookingSuccess.set(null); this.bookingStep.set(1); this.selectedServices.set([]); this.selectedSlot = null; this.tab.set('explore'); }

  cancelBooking(id: number): void {
    if (!confirm('Cancel this booking?')) return;
    this.api.patch(`/bookings/my/${id}/cancel`).subscribe({
      next: () => { this.toast.show('Booking cancelled', '', 'warn'); this.loadMyBookings(); },
      error: () => this.toast.show('Error', 'Failed to cancel', 'err')
    });
  }

  rateBooking(id: number, rating: number): void {
    this.api.post(`/bookings/my/${id}/rate`, { rating }).subscribe({
      next: () => { this.toast.show('Rating submitted! ⭐', '', 'ok'); this.loadMyBookings(); },
      error: () => this.toast.show('Error', 'Failed to submit rating', 'err')
    });
  }

  markRead(id: number): void { this.notifSvc.markRead(id).subscribe(() => { this.loadNotifications(); this.notifSvc.refreshCount(); }); }
  markAllRead(): void { this.notifSvc.markAllRead().subscribe(() => { this.loadNotifications(); this.notifSvc.refreshCount(); }); }

  statusLabel(s: string): string { const m: Record<string,string> = {PENDING:'⏳ Pending',CONFIRMED:'✓ Confirmed',COMPLETED:'🏁 Done',REJECTED:'✕ Rejected',CANCELLED:'🚫 Cancelled'}; return m[s]||s; }
  statusClass(s: string): string { return s==='PENDING'?'by':s==='CONFIRMED'?'bb':s==='COMPLETED'?'bm':'br'; }
  notifIcon(type: string): string { const m: Record<string,string> = {NEW_BOOKING:'📋',BOOKING_CONFIRMED:'✅',BOOKING_REJECTED:'❌',BOOKING_CANCELLED:'🚫',BOOKING_COMPLETED:'🏁'}; return m[type]||'🔔'; }
  notifColor(type: string): string { return type.includes('CONFIRMED')||type.includes('COMPLETED') ? 'var(--emerald)' : type.includes('REJECTED')||type.includes('CANCELLED') ? 'var(--crimson)' : 'var(--amber)'; }
  notifBg(type: string): string { return type.includes('CONFIRMED')||type.includes('COMPLETED') ? 'rgba(16,217,138,0.12)' : type.includes('REJECTED')||type.includes('CANCELLED') ? 'rgba(255,59,107,0.12)' : 'rgba(245,166,35,0.12)'; }
  timeAgo(ts: string): string {
    const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (s < 60) return 'just now'; if (s < 3600) return `${Math.floor(s/60)}m ago`; return `${Math.floor(s/3600)}h ago`;
  }
  logout(): void { this.authSvc.logout(); }
}
