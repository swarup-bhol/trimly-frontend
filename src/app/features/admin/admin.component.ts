import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { AdminStats, Shop, Booking } from '../../core/models/models';
import { NotificationService } from '../../core/services/notification.service';

type AdminTab = 'overview' | 'shops' | 'bookings' | 'revenue';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div style="display:flex;flex-direction:column;min-height:100vh">
  <!-- TOPBAR -->
  <header class="topbar">
    <div class="topbar-brand">TRIMLY ADMIN</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      @for (n of navItems; track n.id) {
        <button class="btn btn-sm" [class.btn-amber]="tab() === n.id" [class.btn-ghost]="tab() !== n.id" (click)="tab.set(n.id)">
          {{ n.icon }} {{ n.label }}
          @if (n.badge && n.badge > 0) {
            <span style="background:var(--crimson);color:#fff;font-size:10px;padding:1px 6px;border-radius:10px;margin-left:4px">{{ n.badge }}</span>
          }
        </button>
      }
    </div>
    <div class="topbar-right">
      <div class="user-pill"><div class="up-av">A</div><div><div class="up-name">Admin</div><div class="up-role">Platform</div></div></div>
      <button class="btn btn-ghost btn-sm" (click)="logout()">Logout</button>
    </div>
  </header>

  <div class="main-content">
    @if (loading()) {
      <div class="loading-overlay"><div class="spinner"></div><span>Loading platform data...</span></div>
    } @else {
      @switch (tab()) {
        @case ('overview') { <ng-container *ngTemplateOutlet="overviewTpl"></ng-container> }
        @case ('shops') { <ng-container *ngTemplateOutlet="shopsTpl"></ng-container> }
        @case ('bookings') { <ng-container *ngTemplateOutlet="bookingsTpl"></ng-container> }
        @case ('revenue') { <ng-container *ngTemplateOutlet="revenueTpl"></ng-container> }
      }
    }
  </div>
</div>

<!-- OVERVIEW -->
<ng-template #overviewTpl>
  <div class="page">
    <div class="ph">
      <div class="ph-bc">Admin · <span class="ph-bc-cur">Overview</span></div>
      <div class="ph-title">PLATFORM OVERVIEW</div>
      <div class="ph-sub">Real-time platform performance</div>
    </div>
    @if (stats()) {
      <div class="sg">
        <div class="sc"><div class="sc-accent" style="background:linear-gradient(90deg,var(--amber),transparent)"></div><div class="sc-icon">🏪</div><div class="sc-val" style="color:var(--amber)">{{ stats()!.totalShops }}</div><div class="sc-label">Total Shops</div><div class="sc-chip chip-y">{{ stats()!.activeShops }} active</div></div>
        <div class="sc"><div class="sc-accent" style="background:linear-gradient(90deg,var(--amber),transparent)"></div><div class="sc-icon">⏳</div><div class="sc-val" style="color:var(--amber)">{{ stats()!.pendingShops }}</div><div class="sc-label">Pending Approval</div><div class="sc-chip chip-r">Needs review</div></div>
        <div class="sc"><div class="sc-accent" style="background:linear-gradient(90deg,var(--emerald),transparent)"></div><div class="sc-icon">📋</div><div class="sc-val" style="color:var(--emerald)">{{ stats()!.totalBookings }}</div><div class="sc-label">Total Bookings</div><div class="sc-chip chip-g">{{ stats()!.completedBookings }} completed</div></div>
        <div class="sc"><div class="sc-accent" style="background:linear-gradient(90deg,var(--sky),transparent)"></div><div class="sc-icon">👤</div><div class="sc-val" style="color:var(--sky)">{{ stats()!.totalCustomers }}</div><div class="sc-label">Customers</div><div class="sc-chip chip-b">Registered</div></div>
      </div>
      <div class="g2" style="margin-top:20px">
        <div class="card">
          <div class="ch"><div class="ct">Platform Revenue</div></div>
          <div style="font-family:'Unbounded',sans-serif;font-size:36px;font-weight:900;color:var(--amber)">₹{{ stats()!.platformRevenue.toLocaleString('en-IN') }}</div>
          <div style="font-size:12px;color:var(--text3);margin-top:4px">10% commission from ₹{{ stats()!.totalRevenue.toLocaleString('en-IN') }} gross</div>
        </div>
        <div class="card">
          <div class="ch"><div class="ct">Pending Shops</div><button class="btn btn-sm btn-amber" (click)="tab.set('shops')">Review All →</button></div>
          @for (shop of stats()!.recentShops.slice(0,3); track shop.id) {
            <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)">
              <div style="font-size:24px">{{ shop.emoji || '✂️' }}</div>
              <div style="flex:1">
                <div style="font-weight:700;font-size:13px">{{ shop.shopName }}</div>
                <div style="font-size:11px;color:var(--text3)">{{ shop.location }} · {{ shop.ownerName }}</div>
              </div>
              <button class="btn btn-emerald btn-sm" (click)="approveShop(shop.id)">Approve</button>
            </div>
          }
          @if (stats()!.recentShops.length === 0) {
            <div class="empty"><div class="ei">✅</div><div class="et">No pending shops</div></div>
          }
        </div>
      </div>
    }
  </div>
</ng-template>

<!-- SHOPS -->
<ng-template #shopsTpl>
  <div class="page">
    <div class="ph"><div class="ph-bc">Admin · <span class="ph-bc-cur">All Shops</span></div><div class="ph-title">ALL SHOPS</div><div class="ph-sub">Manage all barber shops on the platform</div></div>
    <div style="display:flex;gap:6px;margin-bottom:18px;flex-wrap:wrap">
      @for (f of ['all','ACTIVE','PENDING','DISABLED']; track f) {
        <button class="btn btn-sm" [class.btn-amber]="shopFilter() === f" [class.btn-outline]="shopFilter() !== f" (click)="shopFilter.set(f)">{{ f === 'all' ? 'All' : f }}</button>
      }
    </div>
    <div class="tw"><table class="tb">
      <thead><tr><th>Shop</th><th>Owner</th><th>Location</th><th>Plan</th><th>Status</th><th>Rating</th><th>Bookings</th><th>Actions</th></tr></thead>
      <tbody>
        @for (shop of filteredShops(); track shop.id) {
          <tr>
            <td><div class="tn">{{ shop.emoji || '✂️' }} {{ shop.shopName }}</div></td>
            <td style="color:var(--text2);font-size:12px">{{ shop.ownerName }}</td>
            <td style="color:var(--text3);font-size:12px">{{ shop.location }}</td>
            <td><span class="badge" [class.by]="shop.plan==='pro'" [class.bm]="shop.plan!=='pro'">{{ shop.plan }}</span></td>
            <td><span class="badge" [class.bg]="shop.status==='ACTIVE'" [class.by]="shop.status==='PENDING'" [class.br]="shop.status==='DISABLED'">{{ shop.status }}</span></td>
            <td style="color:var(--amber)">{{ shop.rating ? (shop.rating | number:'1.1-1') + '★' : '—' }}</td>
            <td style="color:var(--text2)">{{ shop.totalBookings }}</td>
            <td>
              <div style="display:flex;gap:6px">
                @if (shop.status === 'PENDING') { <button class="btn btn-emerald btn-sm" (click)="approveShop(shop.id)">Approve</button> }
                @if (shop.status === 'ACTIVE') { <button class="btn btn-crimson btn-sm" (click)="disableShop(shop.id)">Disable</button> }
                @if (shop.status === 'DISABLED') { <button class="btn btn-sky btn-sm" (click)="enableShop(shop.id)">Enable</button> }
              </div>
            </td>
          </tr>
        }
      </tbody>
    </table></div>
  </div>
</ng-template>

<!-- BOOKINGS -->
<ng-template #bookingsTpl>
  <div class="page">
    <div class="ph"><div class="ph-bc">Admin · <span class="ph-bc-cur">Bookings</span></div>
      <div class="ph-row">
        <div><div class="ph-title">ALL BOOKINGS</div><div class="ph-sub">Every transaction across the platform</div></div>
        <div style="text-align:right"><div style="font-family:'Unbounded',sans-serif;font-size:32px;font-weight:900;color:var(--amber)">₹{{ filteredCommission() | number:'1.0-0' }}</div><div style="font-size:12px;color:var(--text2)">Commission ({{ bookingFilter() }})</div></div>
      </div>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:18px;flex-wrap:wrap">
      @for (f of [['all','All'],['PENDING','Pending'],['CONFIRMED','Confirmed'],['COMPLETED','Completed'],['CANCELLED','Cancelled'],['REJECTED','Rejected']]; track f[0]) {
        <button class="btn btn-sm" [class.btn-amber]="bookingFilter() === f[0]" [class.btn-outline]="bookingFilter() !== f[0]" (click)="bookingFilter.set(f[0])">{{ f[1] }}</button>
      }
    </div>
    <div class="tw"><table class="tb">
      <thead><tr><th>Customer</th><th>Shop</th><th>Services</th><th>Date · Slot</th><th>Duration</th><th>Amount</th><th>Commission</th><th>Status</th></tr></thead>
      <tbody>
        @for (b of filteredBookings(); track b.id) {
          <tr>
            <td><div class="tn">{{ b.customerName }}</div><div class="ts">{{ b.customerPhone }}</div></td>
            <td style="color:var(--text2);font-size:12px">{{ b.shopName }}</td>
            <td style="color:var(--text2);font-size:12px;max-width:160px">{{ b.servicesLabel }}</td>
            <td style="color:var(--text2);font-size:12px">{{ b.bookingDate }} · {{ b.slot }}</td>
            <td style="color:var(--text2)">{{ b.duration }}m</td>
            <td><span class="ta">₹{{ b.amount }}</span></td>
            <td style="font-family:'Unbounded',sans-serif;font-size:16px;color:var(--amber)">₹{{ (b.amount * 0.1) | number:'1.0-0' }}</td>
            <td><span class="badge" [class]="statusClass(b.status)">{{ b.status }}</span></td>
          </tr>
        }
      </tbody>
    </table></div>
  </div>
</ng-template>

<!-- REVENUE -->
<ng-template #revenueTpl>
  <div class="page">
    <div class="ph"><div class="ph-bc">Admin · <span class="ph-bc-cur">Revenue</span></div><div class="ph-title">REVENUE</div></div>
    @if (stats()) {
      <div class="sg">
        <div class="sc"><div class="sc-accent" style="background:linear-gradient(90deg,var(--amber),transparent)"></div><div class="sc-icon">💳</div><div class="sc-val" style="color:var(--amber)">₹{{ stats()!.platformRevenue.toLocaleString('en-IN') }}</div><div class="sc-label">Booking Commission</div><div class="sc-chip chip-y">10% per booking</div></div>
        <div class="sc"><div class="sc-accent" style="background:linear-gradient(90deg,var(--emerald),transparent)"></div><div class="sc-icon">🏆</div><div class="sc-val" style="color:var(--emerald)">₹{{ stats()!.totalRevenue.toLocaleString('en-IN') }}</div><div class="sc-label">Gross Revenue</div><div class="sc-chip chip-g">All bookings</div></div>
        <div class="sc"><div class="sc-accent" style="background:linear-gradient(90deg,var(--sky),transparent)"></div><div class="sc-icon">📈</div><div class="sc-val" style="color:var(--sky)">{{ stats()!.activeShops }}</div><div class="sc-label">Paying Shops</div><div class="sc-chip chip-b">Active</div></div>
        <div class="sc"><div class="sc-accent" style="background:linear-gradient(90deg,var(--violet),transparent)"></div><div class="sc-icon">📋</div><div class="sc-val" style="color:var(--violet)">{{ stats()!.completedBookings }}</div><div class="sc-label">Completed Bookings</div><div class="sc-chip chip-b">Revenue earned</div></div>
      </div>
      <div class="card" style="margin-top:20px">
        <div class="ch"><div class="ct">Per-Shop Breakdown</div></div>
        @for (s of shops(); track s.id) {
          <div style="padding:16px 0;border-bottom:1px solid var(--border)">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <div style="font-weight:600">{{ s.emoji || '✂️' }} {{ s.shopName }} <span class="badge" [class.by]="s.plan==='pro'" [class.bm]="s.plan!=='pro'">{{ s.plan }}</span></div>
              <div style="text-align:right">
                <span style="font-family:'Unbounded',sans-serif;font-size:20px;color:var(--amber)">₹{{ (s.monthlyRev * s.commissionPct / 100) | number:'1.0-0' }}</span>
                <span style="font-size:11px;color:var(--text3);margin-left:8px">from ₹{{ s.monthlyRev | number:'1.0-0' }}</span>
              </div>
            </div>
            <div style="height:6px;border-radius:3px;overflow:hidden;background:rgba(255,255,255,0.05)">
              <div [style.width]="(s.monthlyRev > 0 ? s.commissionPct : 0) + '%'" style="height:100%;background:var(--amber);border-radius:3px"></div>
            </div>
            <div style="font-size:11px;color:var(--text3);margin-top:5px">{{ s.commissionPct }}% commission + ₹{{ s.subscriptionFee }}/mo subscription</div>
          </div>
        }
      </div>
    }
  </div>
</ng-template>
  `
})
export class AdminComponent implements OnInit {
  private api = inject(ApiService);
  private authSvc = inject(AuthService);
  private toast = inject(ToastService);

  tab = signal<AdminTab>('overview');
  loading = signal(true);
  stats = signal<AdminStats | null>(null);
  shops = signal<Shop[]>([]);
  bookings = signal<Booking[]>([]);
  shopFilter = signal('all');
  bookingFilter = signal('all');

  get navItems() {
    return [
      { id: 'overview' as AdminTab, icon: '📊', label: 'Overview', badge: 0 },
      { id: 'shops' as AdminTab, icon: '🏪', label: 'All Shops', badge: this.stats()?.pendingShops ?? 0 },
      { id: 'bookings' as AdminTab, icon: '📋', label: 'Bookings', badge: 0 },
      { id: 'revenue' as AdminTab, icon: '💰', label: 'Revenue', badge: 0 }
    ];
  }

  filteredShops() {
    const f = this.shopFilter();
    return f === 'all' ? this.shops() : this.shops().filter(s => s.status === f);
  }

  filteredBookings() {
    const f = this.bookingFilter();
    return f === 'all' ? this.bookings() : this.bookings().filter(b => b.status === f);
  }

  filteredCommission() {
    return this.filteredBookings().reduce((sum, b) => sum + b.amount * 0.1, 0);
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.api.get<AdminStats>('/admin/stats').subscribe({
      next: s => { this.stats.set(s); this.loading.set(false); }
    });
    this.api.get<Shop[]>('/shops').subscribe({ next: s => this.shops.set(s) });
    this.api.get<Booking[]>('/bookings').subscribe({ next: b => this.bookings.set(b) });
  }

  approveShop(id: number): void {
    this.api.patchWithParams(`/shops/${id}/status`, { status: 'ACTIVE' }).subscribe({
      next: () => { this.toast.show('Shop Approved ✓', 'Barber can now start accepting bookings.', 'ok'); this.loadData(); },
      error: () => this.toast.show('Error', 'Failed to approve shop', 'err')
    });
  }

  disableShop(id: number): void {
    this.api.patchWithParams(`/shops/${id}/status`, { status: 'DISABLED' }).subscribe({
      next: () => { this.toast.show('Shop Disabled', 'Barber cannot login until re-enabled.', 'warn'); this.loadData(); },
      error: () => this.toast.show('Error', 'Failed to disable shop', 'err')
    });
  }

  enableShop(id: number): void {
    this.api.patchWithParams(`/shops/${id}/status`, { status: 'ACTIVE' }).subscribe({
      next: () => { this.toast.show('Shop Re-enabled', 'Barber can now login again.', 'ok'); this.loadData(); },
      error: () => this.toast.show('Error', 'Failed to enable shop', 'err')
    });
  }

  statusClass(s: string): string {
    return s === 'ACTIVE' ? 'bg' : s === 'PENDING' ? 'by' : s === 'CONFIRMED' ? 'bb' : s === 'COMPLETED' ? 'bm' : 'br';
  }

  logout(): void { this.authSvc.logout(); }
}
