import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { NotificationService } from '../../core/services/notification.service';
import { Shop, Service, Booking, Notification } from '../../core/models/models';

type BarberTab = 'bookings' | 'notifications' | 'services' | 'slots' | 'myshop' | 'earnings' | 'sharelink';

@Component({
  selector: 'app-barber',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div style="display:flex;flex-direction:column;min-height:100vh">
  <!-- TOPBAR -->
  <header class="topbar">
    <div class="topbar-brand">TRIMLY</div>
    <div class="topbar-right">
      <button class="notif-btn" (click)="tab.set('notifications')">
        🔔
        @if (unreadCount() > 0) { <div class="notif-dot"></div> }
      </button>
      <div class="user-pill">
        <div class="up-av">{{ initials() }}</div>
        <div>
          <div class="up-name">{{ session()?.name }}</div>
          <div class="up-role">Barber</div>
        </div>
      </div>
      <button class="btn btn-ghost btn-sm" (click)="logout()">Logout</button>
    </div>
  </header>

  <div class="main">
    <!-- SIDEBAR -->
    <aside class="sidebar">
      <div class="sb-sec">Dashboard</div>
      @for (n of navItems; track n.id) {
        <button class="sb-item" [class.on]="tab() === n.id" (click)="tab.set(n.id)">
          <span>{{ n.icon }}</span> {{ n.label }}
          @if (n.badge && n.badge > 0) { <span class="sb-badge">{{ n.badge }}</span> }
        </button>
      }
      @if (shop()) {
        <div class="sb-sec" style="margin-top:16px">Shop Status</div>
        <div style="padding:10px 12px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span [class]="shop()!.isOpen ? 'open-badge ob-open' : 'open-badge ob-closed'">
              {{ shop()!.isOpen ? '● Open' : '● Closed' }}
            </span>
          </div>
          <button class="btn btn-sm btn-block" [class.btn-crimson]="shop()!.isOpen" [class.btn-emerald]="!shop()!.isOpen" (click)="toggleOpen()">
            {{ shop()!.isOpen ? '🔒 Close Shop' : '🔓 Open Shop' }}
          </button>
        </div>
      }
    </aside>

    <main class="main-content">
      @if (loading()) {
        <div class="loading-overlay"><div class="spinner"></div><span>Loading dashboard...</span></div>
      } @else if (shop()?.status === 'PENDING') {
        <div class="page">
          <div class="card card-amber" style="max-width:560px;margin:40px auto;text-align:center;padding:40px">
            <div style="font-size:64px;margin-bottom:16px">⏳</div>
            <div style="font-family:'Unbounded',sans-serif;font-size:28px;font-weight:900;color:var(--amber);margin-bottom:12px">PENDING APPROVAL</div>
            <div style="color:var(--text2);line-height:1.7;margin-bottom:24px">Your shop registration is under review. Our admin team will approve it shortly. You'll see a notification once approved.</div>
            <div class="sbox" style="text-align:left">
              <div class="srow"><span style="color:var(--text2)">Shop Name</span><span>{{ shop()!.shopName }}</span></div>
              <div class="srow"><span style="color:var(--text2)">Location</span><span>{{ shop()!.location }}</span></div>
              <div class="srow"><span style="color:var(--text2)">Status</span><span class="badge by">⏳ Pending</span></div>
            </div>
            <button class="btn btn-ghost btn-sm" style="margin-top:16px" (click)="logout()">← Logout</button>
          </div>
        </div>
      } @else {
        @switch (tab()) {
          @case ('bookings') { <ng-container *ngTemplateOutlet="bookingsTpl"></ng-container> }
          @case ('notifications') { <ng-container *ngTemplateOutlet="notifsTpl"></ng-container> }
          @case ('services') { <ng-container *ngTemplateOutlet="servicesTpl"></ng-container> }
          @case ('slots') { <ng-container *ngTemplateOutlet="slotsTpl"></ng-container> }
          @case ('myshop') { <ng-container *ngTemplateOutlet="myshopTpl"></ng-container> }
          @case ('earnings') { <ng-container *ngTemplateOutlet="earningsTpl"></ng-container> }
          @case ('sharelink') { <ng-container *ngTemplateOutlet="sharelinkTpl"></ng-container> }
        }
      }
    </main>
  </div>

  <!-- MOBILE NAV -->
  <nav class="mobile-nav">
    @for (n of mobileNavItems; track n.id) {
      <button class="mn-item" [class.on]="tab() === n.id" (click)="tab.set(n.id)">
        <span class="mn-icon">{{ n.icon }} @if(n.badge && n.badge > 0){<span class="mn-badge">{{n.badge}}</span>}</span>
        {{ n.label }}
      </button>
    }
  </nav>
</div>

<!-- BOOKINGS TAB -->
<ng-template #bookingsTpl>
  <div class="page">
    <div class="ph">
      <div class="ph-bc">Dashboard · <span class="ph-bc-cur">Bookings</span></div>
      <div class="ph-row">
        <div><div class="ph-title">BOOKINGS</div><div class="ph-sub">Manage your appointments</div></div>
        <button class="btn btn-ghost-amber btn-sm" (click)="loadBookings()">↻ Refresh</button>
      </div>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:18px;flex-wrap:wrap">
      @for (f of [['all','All'],['PENDING','Pending'],['CONFIRMED','Confirmed'],['COMPLETED','Completed'],['REJECTED','Rejected'],['CANCELLED','Cancelled']]; track f[0]) {
        <button class="btn btn-sm" [class.btn-amber]="bkFilter() === f[0]" [class.btn-outline]="bkFilter() !== f[0]" (click)="bkFilter.set(f[0])">{{ f[1] }}</button>
      }
    </div>
    @if (filteredBookings().length === 0) {
      <div class="empty"><div class="ei">📋</div><div class="et">No bookings yet. Share your shop link to start getting customers!</div></div>
    }
    @for (b of filteredBookings(); track b.id) {
      <div class="bk">
        <div class="bk-av">{{ b.customerName.charAt(0).toUpperCase() }}</div>
        <div class="bk-body">
          <div class="bk-name">{{ b.customerName }}</div>
          <div class="bk-detail">{{ b.customerPhone }} · {{ b.bookingDate }} · {{ b.slot }}</div>
          <div class="bk-tags">
            <span class="badge" [class]="statusClass(b.status)">{{ statusLabel(b.status) }}</span>
            <span class="badge bm">{{ b.servicesLabel }}</span>
            <span class="badge bb">⏱ {{ b.duration }}min</span>
          </div>
          <div class="bk-amt">₹{{ b.amount }}</div>
          <div class="bk-actions">
            @if (b.status === 'PENDING') {
              <button class="btn btn-emerald btn-sm" (click)="updateStatus(b.id, 'CONFIRMED')">✓ Accept</button>
              <button class="btn btn-crimson btn-sm" (click)="updateStatus(b.id, 'REJECTED')">✕ Reject</button>
            }
            @if (b.status === 'CONFIRMED') {
              <button class="btn btn-amber btn-sm" (click)="updateStatus(b.id, 'COMPLETED')">🏁 Mark Done</button>
              <button class="btn btn-crimson btn-sm" (click)="updateStatus(b.id, 'CANCELLED')">Cancel</button>
            }
          </div>
        </div>
      </div>
    }
  </div>
</ng-template>

<!-- NOTIFICATIONS TAB -->
<ng-template #notifsTpl>
  <div class="page">
    <div class="ph">
      <div class="ph-row">
        <div><div class="ph-title">NOTIFICATIONS</div><div class="ph-sub">Your booking updates</div></div>
        @if (hasUnreadNotifications()) {
          <button class="btn btn-ghost-amber btn-sm" (click)="markAllRead()">
            Mark all read
          </button>
        }
      </div>
    </div>
    @if (notifications().length === 0) {
      <div class="empty"><div class="ei">🔔</div><div class="et">No notifications yet</div></div>
    }
    @for (n of notifications(); track n.id) {
      <div (click)="markRead(n.id)" [style.background]="n.isRead ? 'var(--card)' : 'rgba(245,166,35,0.04)'"
           [style.border]="'1px solid ' + (n.isRead ? 'var(--border)' : 'rgba(245,166,35,0.2)')"
           style="display:flex;gap:14px;align-items:flex-start;padding:16px 20px;margin-bottom:8px;border-radius:14px;cursor:pointer;transition:all .2s">
        <div style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;background:rgba(245,166,35,0.12);flex-shrink:0">
          {{ notifIcon(n.type) }}
        </div>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:3px">
            <div style="font-weight:700;font-size:14px" [style.color]="n.isRead ? 'var(--text)' : 'var(--amber)'">{{ n.title }}</div>
            @if (!n.isRead) { <span style="width:8px;height:8px;border-radius:50%;background:var(--amber);flex-shrink:0;display:inline-block"></span> }
          </div>
          <div style="font-size:13px;color:var(--text2);line-height:1.55">{{ n.body }}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:5px">{{ timeAgo(n.createdAt) }}</div>
        </div>
      </div>
    }
  </div>
</ng-template>

<!-- SERVICES TAB -->
<ng-template #servicesTpl>
  <div class="page">
    <div class="ph">
      <div class="ph-row">
        <div><div class="ph-title">SERVICES</div><div class="ph-sub">Manage your offered services</div></div>
        <button class="btn btn-amber btn-sm" (click)="showAddService.set(true)">+ Add Service</button>
      </div>
    </div>

    @if (showAddService()) {
      <div class="card card-amber" style="margin-bottom:20px">
        <div class="ch"><div class="ct">{{ editService ? 'Edit Service' : 'Add New Service' }}</div><button class="btn btn-ghost btn-sm" (click)="cancelService()">✕</button></div>
        <div class="g2">
          <div class="fg"><label class="fl">Service Name *</label><input class="fi" placeholder="e.g. Classic Haircut" [(ngModel)]="svcForm.name" /></div>
          <div class="fg"><label class="fl">Category</label>
            <select class="fi" [(ngModel)]="svcForm.category">
              <option value="hair">Hair</option><option value="beard">Beard</option><option value="facial">Facial</option>
              <option value="kids">Kids</option><option value="combo">Combo</option><option value="spa">Spa</option><option value="color">Color</option>
            </select>
          </div>
          <div class="fg"><label class="fl">Duration (mins) *</label><input class="fi" type="number" placeholder="30" [(ngModel)]="svcForm.duration" /></div>
          <div class="fg"><label class="fl">Price (₹) *</label><input class="fi" type="number" placeholder="350" [(ngModel)]="svcForm.price" /></div>
          <div class="fg"><label class="fl">Description</label><input class="fi" placeholder="Short description" [(ngModel)]="svcForm.description" /></div>
          <div class="fg"><label class="fl">Icon (emoji)</label><input class="fi" placeholder="💇" [(ngModel)]="svcForm.icon" /></div>
        </div>
        <div style="display:flex;gap:10px;margin-top:8px">
          <button class="btn btn-amber" [disabled]="savingService()" (click)="saveService()">{{ savingService() ? 'Saving...' : (editService ? 'Update' : 'Add Service') }}</button>
          <button class="btn btn-outline" (click)="cancelService()">Cancel</button>
        </div>
        @if (svcErr()) { <div class="err-banner" style="margin-top:10px">{{ svcErr() }}</div> }
      </div>
    }

    @if (shop()?.services?.length === 0) {
      <div class="empty"><div class="ei">✂️</div><div class="et">No services yet. Add your first service to start accepting bookings!</div></div>
    }
    @for (svc of shop()?.services || []; track svc.id) {
      <div class="svc" [class.disabled]="!svc.enabled">
        <div class="svc-ico">{{ svc.icon || '✂️' }}</div>
        <div class="svc-body">
          <div class="svc-name">{{ svc.name }}</div>
          <div class="svc-meta">{{ svc.category }} · ⏱ {{ svc.duration }} min{{ svc.description ? ' · ' + svc.description : '' }}</div>
        </div>
        <div class="svc-price">₹{{ svc.price }}</div>
        <div style="display:flex;gap:6px;margin-left:12px">
          <button class="btn btn-sm btn-outline" (click)="startEditService(svc)">Edit</button>
          <button class="btn btn-sm" [class.btn-amber]="!svc.enabled" [class.btn-crimson]="svc.enabled" (click)="toggleService(svc)">{{ svc.enabled ? 'Disable' : 'Enable' }}</button>
          <button class="btn btn-sm btn-crimson" (click)="deleteService(svc.id)">✕</button>
        </div>
      </div>
    }
  </div>
</ng-template>

<!-- SLOTS TAB -->
<ng-template #slotsTpl>
  <div class="page">
    <div class="ph"><div class="ph-title">SLOTS & HOURS</div><div class="ph-sub">Configure your working hours</div></div>
    @if (shop()) {
      <div class="card" style="margin-bottom:20px">
        <div class="ch"><div class="ct">Business Hours</div></div>
        <div class="g2">
          <div class="fg"><label class="fl">Opening Time</label><input class="fi" type="time" [(ngModel)]="shopForm.openTime" /></div>
          <div class="fg"><label class="fl">Closing Time</label><input class="fi" type="time" [(ngModel)]="shopForm.closeTime" /></div>
          <div class="fg"><label class="fl">Slot Duration (mins)</label>
            <select class="fi" [(ngModel)]="shopForm.slotMin">
              <option [ngValue]="15">15 min</option><option [ngValue]="30">30 min</option><option [ngValue]="45">45 min</option><option [ngValue]="60">60 min</option>
            </select>
          </div>
          <div class="fg"><label class="fl">Seats</label>
            <select class="fi" [(ngModel)]="shopForm.seats">
              <option [ngValue]="1">1 seat</option><option [ngValue]="2">2 seats</option><option [ngValue]="3">3 seats</option><option [ngValue]="4">4 seats</option>
            </select>
          </div>
        </div>
        <div class="fg"><label class="fl">Work Days</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
            @for (d of ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']; track d) {
              <button class="btn btn-sm" [class.btn-amber]="isWorkDay(d)" [class.btn-outline]="!isWorkDay(d)" (click)="toggleWorkDay(d)">{{ d }}</button>
            }
          </div>
        </div>
        <button class="btn btn-amber" [disabled]="savingShop()" (click)="saveHours()">{{ savingShop() ? 'Saving...' : 'Save Hours' }}</button>
      </div>
    }
  </div>
</ng-template>

<!-- MY SHOP TAB -->
<ng-template #myshopTpl>
  <div class="page">
    <div class="ph"><div class="ph-title">MY SHOP</div><div class="ph-sub">Edit your shop profile</div></div>
    @if (shop()) {
      <div class="card">
        <div class="ch"><div class="ct">Shop Profile</div></div>
        <div class="g2">
          <div class="fg"><label class="fl">Shop Name</label><input class="fi" [(ngModel)]="shopForm.shopName" /></div>
          <div class="fg"><label class="fl">Emoji</label><input class="fi" [(ngModel)]="shopForm.emoji" placeholder="✂️" /></div>
          <div class="fg"><label class="fl">Location</label><input class="fi" [(ngModel)]="shopForm.location" /></div>
          <div class="fg"><label class="fl">Phone</label><input class="fi" [(ngModel)]="shopForm.phone" /></div>
        </div>
        <div class="fg"><label class="fl">Bio</label><textarea class="fi" [(ngModel)]="shopForm.bio" rows="3"></textarea></div>
        <button class="btn btn-amber" [disabled]="savingShop()" (click)="saveShop()">{{ savingShop() ? 'Saving...' : 'Save Changes' }}</button>
      </div>
    }
  </div>
</ng-template>

<!-- EARNINGS TAB -->
<ng-template #earningsTpl>
  <div class="page">
    <div class="ph"><div class="ph-title">EARNINGS</div><div class="ph-sub">Your revenue overview</div></div>
    @if (shop()) {
      <div class="sg">
        <div class="sc"><div class="sc-accent" style="background:linear-gradient(90deg,var(--amber),transparent)"></div><div class="sc-icon">💰</div><div class="sc-val" style="color:var(--amber)">₹{{ shop()!.monthlyRev.toLocaleString('en-IN') }}</div><div class="sc-label">This Month</div></div>
        <div class="sc"><div class="sc-accent" style="background:linear-gradient(90deg,var(--emerald),transparent)"></div><div class="sc-icon">📋</div><div class="sc-val" style="color:var(--emerald)">{{ completedCount() }}</div><div class="sc-label">Completed</div></div>
        <div class="sc"><div class="sc-accent" style="background:linear-gradient(90deg,var(--sky),transparent)"></div><div class="sc-icon">⭐</div><div class="sc-val" style="color:var(--sky)">{{ shop()!.rating ? (shop()!.rating! | number:'1.1-1') : '—' }}</div><div class="sc-label">Rating ({{ shop()!.reviews }} reviews)</div></div>
        <div class="sc"><div class="sc-accent" style="background:linear-gradient(90deg,var(--crimson),transparent)"></div><div class="sc-icon">💳</div><div class="sc-val" style="color:var(--crimson)">₹{{ (shop()!.monthlyRev * shop()!.commissionPct / 100) | number:'1.0-0' }}</div><div class="sc-label">Commission Paid ({{ shop()!.commissionPct }}%)</div></div>
      </div>
      <div class="card">
        <div class="ch"><div class="ct">Recent Completed</div></div>
        @for (b of completedBookings().slice(0,10); track b.id) {
          <div class="pb-card">
            <div class="pb-ico">{{ b.shopEmoji || '✂️' }}</div>
            <div style="flex:1">
              <div style="font-weight:700;font-size:14px">{{ b.customerName }}</div>
              <div style="font-size:12px;color:var(--text2)">{{ b.servicesLabel }} · {{ b.slot }} · {{ b.bookingDate }}</div>
              @if (b.rating) { <div style="display:flex;gap:3px;margin-top:4px">@for(s of [1,2,3,4,5]; track s){<span [style.color]="s<=b.rating! ? 'var(--amber)' : 'var(--border2)'">★</span>}</div> }
            </div>
            <div style="font-family:'Unbounded',sans-serif;font-size:18px;color:var(--amber)">₹{{ b.amount }}</div>
          </div>
        }
        @if (completedBookings().length === 0) {
          <div class="empty"><div class="ei">💰</div><div class="et">No completed bookings yet</div></div>
        }
      </div>
    }
  </div>
</ng-template>

<!-- SHARE LINK TAB -->
<ng-template #sharelinkTpl>
  <div class="page">
    <div class="ph"><div class="ph-title">SHARE LINK</div><div class="ph-sub">Share your booking page</div></div>
    @if (shop()) {
      <div class="card card-amber" style="max-width:560px">
        <div class="ch"><div class="ct">Your Booking URL</div></div>
        <div style="background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:14px 16px;font-size:13px;font-family:monospace;word-break:break-all;margin-bottom:16px;color:var(--sky)">
          {{ bookingUrl() }}
        </div>
        <button class="btn btn-amber btn-block" (click)="copyLink()">📋 Copy Link</button>
        <div style="margin-top:20px;padding:16px;background:var(--card2);border-radius:12px;border:1px solid var(--border)">
          <div style="font-weight:700;margin-bottom:8px">📱 Share with customers</div>
          <div style="font-size:12px;color:var(--text2);line-height:1.7">Share this link via WhatsApp, Instagram bio, or print on your visiting card. Customers can browse your services and book a slot instantly — no app download required.</div>
        </div>
        <div class="sbox" style="margin-top:16px">
          <div class="srow"><span style="color:var(--text2)">Shop</span><span>{{ shop()!.emoji || '✂️' }} {{ shop()!.shopName }}</span></div>
          <div class="srow"><span style="color:var(--text2)">Services</span><span>{{ shop()!.services?.length || 0 }} available</span></div>
          <div class="srow"><span style="color:var(--text2)">Rating</span><span>{{ shop()!.rating ? shop()!.rating! + '★' : 'No reviews yet' }}</span></div>
          <div class="srow"><span style="color:var(--text2)">Status</span><span [class]="shop()!.isOpen ? 'open-badge ob-open' : 'open-badge ob-closed'">{{ shop()!.isOpen ? '● Open' : '● Closed' }}</span></div>
        </div>
      </div>
    }
  </div>
</ng-template>
  `
})
export class BarberComponent implements OnInit {
  private api = inject(ApiService);
  private authSvc = inject(AuthService);
  private toast = inject(ToastService);
  private notifSvc = inject(NotificationService);

  tab = signal<BarberTab>('bookings');
  loading = signal(true);
  shop = signal<Shop | null>(null);
  bookings = signal<Booking[]>([]);
  notifications = signal<Notification[]>([]);
  bkFilter = signal('all');
  showAddService = signal(false);
  savingService = signal(false);
  savingShop = signal(false);
  svcErr = signal<string | null>(null);
  editService: Service | null = null;

  svcForm = { name: '', description: '', category: 'hair', icon: '✂️', duration: 30, price: 0, enabled: true };
  shopForm: any = {};

  session = this.authSvc.session;
  unreadCount = this.notifSvc.unreadCount;

  initials = computed(() => this.session()?.name?.charAt(0)?.toUpperCase() ?? 'B');

  get navItems() {
    const pending = this.bookings().filter(b => b.status === 'PENDING').length;
    const unread = this.notifications().filter(n => !n.isRead).length;
    return [
      { id: 'bookings' as BarberTab, icon: '📋', label: 'Bookings', badge: pending },
      { id: 'notifications' as BarberTab, icon: '🔔', label: 'Notifications', badge: unread },
      { id: 'services' as BarberTab, icon: '✂️', label: 'Services', badge: 0 },
      { id: 'slots' as BarberTab, icon: '🕐', label: 'Slots & Hours', badge: 0 },
      { id: 'myshop' as BarberTab, icon: '🏪', label: 'My Shop', badge: 0 },
      { id: 'earnings' as BarberTab, icon: '💳', label: 'Earnings', badge: 0 },
      { id: 'sharelink' as BarberTab, icon: '🔗', label: 'Share Link', badge: 0 }
    ];
  }
  hasUnreadNotifications = computed(() =>
    this.notifications().some(n => !n.isRead)
  );

  get mobileNavItems() { return this.navItems.slice(0, 5); }

  filteredBookings() {
    const f = this.bkFilter();
    return f === 'all' ? this.bookings() : this.bookings().filter(b => b.status === f);
  }

  completedBookings = computed(() => this.bookings().filter(b => b.status === 'COMPLETED'));
  completedCount = computed(() => this.completedBookings().length);

  bookingUrl() { return `${window.location.origin}/customer?shop=${this.shop()?.id}`; }

  ngOnInit(): void {
    this.loadShop();
    this.loadNotifications();
  }

  loadShop(): void {
    this.loading.set(true);
    this.api.get<Shop>('/shops/my').subscribe({
      next: s => {
        this.shop.set(s);
        this.syncShopForm(s);
        this.loading.set(false);
        this.loadBookings();
      },
      error: () => { this.loading.set(false); }
    });
  }

  loadBookings(): void {
    this.api.get<Booking[]>('/bookings/shop').subscribe({ next: b => this.bookings.set(b) });
  }

  loadNotifications(): void {
    this.api.get<Notification[]>('/notifications').subscribe({ next: n => this.notifications.set(n) });
  }

  syncShopForm(s: Shop): void {
    this.shopForm = {
      shopName: s.shopName, emoji: s.emoji || '✂️', location: s.location,
      phone: s.phone || '', bio: s.bio || '',
      openTime: s.openTime, closeTime: s.closeTime, slotMin: s.slotMin, seats: s.seats,
      workDays: s.workDays || ''
    };
  }

  toggleOpen(): void {
    const s = this.shop();
    if (!s) return;
    this.api.put<Shop>('/shops/my', { isOpen: !s.isOpen }).subscribe({
      next: updated => { this.shop.set(updated); this.toast.show(updated.isOpen ? 'Shop Opened 🔓' : 'Shop Closed 🔒', '', 'ok'); }
    });
  }

  updateStatus(id: number, status: string): void {
    this.api.patch<Booking>(`/bookings/shop/${id}/status`, { status }).subscribe({
      next: updated => {
        this.bookings.update(bks => bks.map(b => b.id === id ? updated : b));
        const labels: Record<string, string> = { CONFIRMED: 'Booking confirmed ✓', REJECTED: 'Booking rejected', COMPLETED: 'Marked as complete 🏁', CANCELLED: 'Booking cancelled' };
        this.toast.show(labels[status] || 'Updated', '', 'ok');
        this.notifSvc.refreshCount();
      },
      error: () => this.toast.show('Error', 'Failed to update booking', 'err')
    });
  }

  saveService(): void {
    if (!this.svcForm.name.trim()) { this.svcErr.set('Service name is required'); return; }
    if (!this.svcForm.price || this.svcForm.duration <= 0) { this.svcErr.set('Price and duration are required'); return; }
    this.savingService.set(true);
    this.svcErr.set(null);
    const req$ = this.editService
      ? this.api.put<Service>(`/shops/my/services/${this.editService.id}`, this.svcForm)
      : this.api.post<Service>('/shops/my/services', this.svcForm);
    req$.subscribe({
      next: () => {
        this.toast.show(this.editService ? 'Service updated' : 'Service added', '', 'ok');
        this.savingService.set(false);
        this.cancelService();
        this.loadShop();
      },
      error: (e) => { this.svcErr.set(e.error?.message || 'Failed'); this.savingService.set(false); }
    });
  }

  startEditService(svc: Service): void {
    this.editService = svc;
    this.svcForm = { name: svc.name, description: svc.description || '', category: svc.category || 'hair', icon: svc.icon || '✂️', duration: svc.duration, price: svc.price, enabled: svc.enabled };
    this.showAddService.set(true);
  }

  cancelService(): void { this.showAddService.set(false); this.editService = null; this.svcErr.set(null); this.svcForm = { name: '', description: '', category: 'hair', icon: '✂️', duration: 30, price: 0, enabled: true }; }

  toggleService(svc: Service): void {
    this.api.put<Service>(`/shops/my/services/${svc.id}`, { enabled: !svc.enabled }).subscribe({
      next: () => { this.toast.show(svc.enabled ? 'Service disabled' : 'Service enabled', '', 'ok'); this.loadShop(); }
    });
  }

  deleteService(id: number): void {
    if (!confirm('Delete this service?')) return;
    this.api.delete(`/shops/my/services/${id}`).subscribe({
      next: () => { this.toast.show('Service deleted', '', 'warn'); this.loadShop(); },
      error: () => this.toast.show('Error', 'Failed to delete', 'err')
    });
  }

  saveShop(): void {
    this.savingShop.set(true);
    this.api.put<Shop>('/shops/my', { shopName: this.shopForm.shopName, location: this.shopForm.location, phone: this.shopForm.phone, bio: this.shopForm.bio, emoji: this.shopForm.emoji }).subscribe({
      next: s => { this.shop.set(s); this.savingShop.set(false); this.toast.show('Shop updated ✓', '', 'ok'); },
      error: () => { this.savingShop.set(false); this.toast.show('Error', 'Failed to save', 'err'); }
    });
  }

  saveHours(): void {
    this.savingShop.set(true);
    this.api.put<Shop>('/shops/my', { openTime: this.shopForm.openTime, closeTime: this.shopForm.closeTime, slotMin: this.shopForm.slotMin, seats: this.shopForm.seats, workDays: this.shopForm.workDays }).subscribe({
      next: s => { this.shop.set(s); this.savingShop.set(false); this.toast.show('Hours updated ✓', '', 'ok'); },
      error: () => { this.savingShop.set(false); this.toast.show('Error', 'Failed to save', 'err'); }
    });
  }

  isWorkDay(d: string): boolean { return (this.shopForm.workDays || '').includes(d); }
  toggleWorkDay(d: string): void {
    const days: string[] = (this.shopForm.workDays || '').split(',').filter((x: string) => x);
    const idx = days.indexOf(d);
    if (idx > -1) days.splice(idx, 1); else days.push(d);
    this.shopForm.workDays = days.join(',');
  }

  markRead(id: number): void { this.notifSvc.markRead(id).subscribe(() => { this.loadNotifications(); this.notifSvc.refreshCount(); }); }
  markAllRead(): void { this.notifSvc.markAllRead().subscribe(() => { this.loadNotifications(); this.notifSvc.refreshCount(); }); }

  copyLink(): void { navigator.clipboard.writeText(this.bookingUrl()).then(() => this.toast.show('Link copied! 📋', '', 'ok')); }

  statusLabel(s: string): string { const m: Record<string,string> = {PENDING:'⏳ Pending',CONFIRMED:'✓ Confirmed',COMPLETED:'🏁 Done',REJECTED:'✕ Rejected',CANCELLED:'🚫 Cancelled'}; return m[s] || s; }
  statusClass(s: string): string { return s==='PENDING'?'by':s==='CONFIRMED'?'bb':s==='COMPLETED'?'bm':s==='REJECTED'?'br':'br'; }
  notifIcon(type: string): string { const m: Record<string,string> = {NEW_BOOKING:'📋',BOOKING_CONFIRMED:'✅',BOOKING_REJECTED:'❌',BOOKING_CANCELLED:'🚫',BOOKING_COMPLETED:'🏁'}; return m[type] || '🔔'; }
  timeAgo(ts: string): string {
    const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (s < 60) return 'just now'; if (s < 3600) return `${Math.floor(s/60)}m ago`; return `${Math.floor(s/3600)}h ago`;
  }

  logout(): void { this.authSvc.logout(); }
}
