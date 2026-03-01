import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ShopService } from '../../core/services/shop.service';
import { BookingService } from '../../core/services/booking.service';
import { ToastService } from '../../core/services/toast.service';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ShopResponse, BookingResponse, DashboardStats } from '../../core/models/models';

type Tab = 'overview' | 'shops' | 'bookings' | 'revenue';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, TopbarComponent, BadgeComponent],
  template: `
    <div style="display:flex;flex-direction:column;min-height:100vh">
      <app-topbar></app-topbar>

      <div class="shell" style="flex:1">

        <!-- Sidebar -->
        <aside class="sidebar">
          <div class="sb-sec">Admin Panel</div>
          @for (n of nav; track n.tab) {
            <button class="sb-item" [class.on]="tab() === n.tab" (click)="tab.set(n.tab)">
              <span class="sb-icon">{{ n.icon }}</span>{{ n.label }}
              @if (n.tab === 'shops' && pendingShops() > 0) {
                <span class="sb-badge">{{ pendingShops() }}</span>
              }
            </button>
          }
          <div class="sb-footer">
            <button class="sb-item" (click)="auth.logout()">🚪 Logout</button>
          </div>
        </aside>

        <main class="main">
          @if (tab() === 'overview')  { <ng-container *ngTemplateOutlet="overviewTpl"></ng-container> }
          @if (tab() === 'shops')     { <ng-container *ngTemplateOutlet="shopsTpl"></ng-container> }
          @if (tab() === 'bookings')  { <ng-container *ngTemplateOutlet="bookingsTpl"></ng-container> }
          @if (tab() === 'revenue')   { <ng-container *ngTemplateOutlet="revenueTpl"></ng-container> }
        </main>
      </div>

      <!-- Mobile nav -->
      <nav class="mobile-nav">
        @for (n of nav; track n.tab) {
          <button class="mni" [class.on]="tab() === n.tab" (click)="tab.set(n.tab)">
            @if (n.tab === 'shops' && pendingShops() > 0) { <span class="mni-badge">{{ pendingShops() }}</span> }
            <span class="mni-icon">{{ n.icon }}</span>{{ n.label }}
          </button>
        }
      </nav>
    </div>

    <!-- ══ TEMPLATES ══ -->

    <!-- Overview -->
    <ng-template #overviewTpl>
      <div class="page anim-fade-up">
        <div class="ph">
          <div class="ph-title">Platform Overview 👑</div>
          <div class="ph-sub">{{ todayDate }} · Admin Dashboard</div>
        </div>

        <div class="sg">
          <div class="sc"><div class="sc-icon">🏪</div><div class="sc-val">{{ stats()?.totalShops || 0 }}</div><div class="sc-label">Total Shops</div><div class="sc-chip chip-g">{{ stats()?.activeShops || 0 }} active</div></div>
          <div class="sc"><div class="sc-icon">⏳</div><div class="sc-val">{{ stats()?.pendingShops || 0 }}</div><div class="sc-label">Pending Approval</div>@if ((stats()?.pendingShops || 0) > 0){<div class="sc-chip chip-y">Needs action</div>}</div>
          <div class="sc"><div class="sc-icon">👤</div><div class="sc-val">{{ stats()?.totalCustomers || 0 }}</div><div class="sc-label">Customers</div></div>
          <div class="sc"><div class="sc-icon">📅</div><div class="sc-val">{{ stats()?.totalBookings || 0 }}</div><div class="sc-label">Total Bookings</div></div>
        </div>

        <div class="g2">
          <div class="sc"><div class="sc-icon">💰</div><div class="sc-val">₹{{ stats()?.totalRevenue | number:'1.0-0' }}</div><div class="sc-label">Gross Revenue</div><div class="sc-chip chip-g">Platform total</div></div>
          <div class="sc"><div class="sc-icon">🏢</div><div class="sc-val">₹{{ stats()?.totalCommission | number:'1.0-0' }}</div><div class="sc-label">Platform Commission</div><div class="sc-chip chip-b">10% of completed</div></div>
        </div>

        @if (pendingShops() > 0) {
          <div class="card" style="margin-top:14px">
            <div class="ch">
              <div class="ct">⏳ Shops Awaiting Approval</div>
              <button class="btn btn-ghost-amber btn-sm" (click)="tab.set('shops')">View all →</button>
            </div>
            @for (s of pendingShopsPreview(); track s.id) {
              <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--border)">
                <div style="display:flex;align-items:center;gap:12px">
                  <div style="font-size:28px">{{ s.emoji || '✂️' }}</div>
                  <div>
                    <div style="font-weight:700">{{ s.shopName }}</div>
                    <div style="font-size:11px;color:var(--text3)">{{ s.ownerName }} · {{ s.city }}</div>
                  </div>
                </div>
                <button class="btn btn-emerald btn-sm" (click)="approve(s.id)">✓ Approve</button>
              </div>
            }
          </div>
        }
      </div>
    </ng-template>

    <!-- Shops -->
    <ng-template #shopsTpl>
      <div class="page anim-fade-up">
        <div class="ph">
          <div class="ph-row">
            <div><div class="ph-title">All Shops</div><div class="ph-sub">{{ shops().length }} shops on platform</div></div>
          </div>
        </div>

        <!-- Status filter -->
        <div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap">
          @for (f of shopFilters; track f.val) {
            <button class="area-pill" [class.on]="shopFilter() === f.val" (click)="shopFilter.set(f.val)">{{ f.label }}</button>
          }
        </div>

        <div class="tw">
          <table class="tb">
            <thead>
              <tr>
                <th>Shop</th><th>Owner</th><th>City</th><th>Plan</th><th>Status</th><th>Bookings</th><th>Revenue</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (s of filteredShops(); track s.id) {
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px">
                      <span style="font-size:20px">{{ s.emoji || '✂️' }}</span>
                      <div>
                        <div class="tn">{{ s.shopName }}</div>
                        <div class="ts">{{ s.area }}</div>
                      </div>
                    </div>
                  </td>
                  <td><div class="tn">{{ s.ownerName }}</div><div class="ts">{{ s.ownerEmail }}</div></td>
                  <td>{{ s.city }}</td>
                  <td><span class="badge" [class]="s.plan === 'PRO' ? 'bv' : 'bm'">{{ s.plan }}</span></td>
                  <td><app-badge [status]="s.status"></app-badge></td>
                  <td>{{ s.totalBookings || 0 }}</td>
                  <td class="ta">₹{{ s.monthlyRevenue | number:'1.0-0' }}</td>
                  <td>
                    <div style="display:flex;gap:4px;flex-wrap:wrap">
                      @if (s.status === 'PENDING') {
                        <button class="btn btn-emerald btn-sm" (click)="approve(s.id)">✓ Approve</button>
                      }
                      @if (s.status === 'ACTIVE') {
                        <button class="btn btn-crimson btn-sm" (click)="disable(s.id)">Disable</button>
                      }
                      @if (s.status === 'DISABLED') {
                        <button class="btn btn-emerald btn-sm" (click)="enable(s.id)">Enable</button>
                      }
                      <button class="btn btn-ghost btn-sm" (click)="openCommission(s)">% Fee</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Commission modal -->
      @if (commissionShop()) {
        <div class="mo" (click)="commissionShop.set(null)">
          <div class="mb" style="max-width:360px" (click)="$event.stopPropagation()">
            <div class="mh"><div class="mt">Set Commission</div><button class="mx" (click)="commissionShop.set(null)">×</button></div>
            <div class="mbody">
              <div style="font-weight:600;margin-bottom:12px">{{ commissionShop()!.shopName }}</div>
              <div class="fg">
                <label class="fl">Commission % (current: {{ commissionShop()!.commissionPercent }}%)</label>
                <input class="fi" type="number" min="0" max="30" [(ngModel)]="newCommission">
              </div>
            </div>
            <div class="mfoot">
              <button class="btn btn-outline btn-sm" (click)="commissionShop.set(null)">Cancel</button>
              <button class="btn btn-amber btn-sm" (click)="saveCommission()">Save</button>
            </div>
          </div>
        </div>
      }
    </ng-template>

    <!-- Bookings -->
    <ng-template #bookingsTpl>
      <div class="page anim-fade-up">
        <div class="ph">
          <div class="ph-row"><div><div class="ph-title">All Bookings</div><div class="ph-sub">{{ bookings().length }} total</div></div></div>
        </div>

        <div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap">
          @for (f of bkFilters; track f.val) {
            <button class="area-pill" [class.on]="bkFilter() === f.val" (click)="bkFilter.set(f.val)">{{ f.label }}</button>
          }
        </div>

        <div class="tw">
          <table class="tb">
            <thead><tr><th>Customer</th><th>Shop</th><th>Services</th><th>Date & Time</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              @for (b of filteredBookings(); track b.id) {
                <tr>
                  <td><div class="tn">{{ b.customerName }}</div><div class="ts">{{ b.customerPhone }}</div></td>
                  <td>{{ b.shopName }}</td>
                  <td>{{ b.servicesSnapshot }}</td>
                  <td><div>{{ b.bookingDate }}</div><div class="ts">{{ b.slotTime }}</div></td>
                  <td class="ta">₹{{ b.totalAmount }}</td>
                  <td><app-badge [status]="b.status"></app-badge></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </ng-template>

    <!-- Revenue -->
    <ng-template #revenueTpl>
      <div class="page anim-fade-up">
        <div class="ph"><div class="ph-title">Revenue Analytics 📊</div></div>
        <div class="sg">
          <div class="sc"><div class="sc-icon">💰</div><div class="sc-val">₹{{ stats()?.totalRevenue | number:'1.0-0' }}</div><div class="sc-label">Gross Revenue</div><div class="sc-chip chip-g">All time</div></div>
          <div class="sc"><div class="sc-icon">🏢</div><div class="sc-val">₹{{ stats()?.totalCommission | number:'1.0-0' }}</div><div class="sc-label">Platform Earnings</div><div class="sc-chip chip-b">10% commission</div></div>
          <div class="sc"><div class="sc-icon">✂️</div><div class="sc-val">₹{{ stats()?.barberEarnings | number:'1.0-0' }}</div><div class="sc-label">Barber Payouts</div></div>
          <div class="sc"><div class="sc-icon">🏁</div><div class="sc-val">{{ stats()?.completedBookings || 0 }}</div><div class="sc-label">Completed Bookings</div></div>
        </div>

        <!-- Revenue by shop -->
        <div class="card">
          <div class="ch"><div class="ct">Revenue by Shop</div></div>
          @for (s of shopsWithRevenue(); track s.id) {
            <div style="padding:10px 0;border-bottom:1px solid var(--border)">
              <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                <div>
                  <span style="font-size:16px">{{ s.emoji || '✂️' }}</span>
                  <b style="margin-left:6px">{{ s.shopName }}</b>
                  <span style="color:var(--text3);font-size:11px;margin-left:6px">{{ s.city }}</span>
                </div>
                <div style="font-family:'Unbounded',sans-serif;font-size:16px;font-weight:700;color:var(--amber)">₹{{ s.monthlyRevenue | number:'1.0-0' }}</div>
              </div>
              <div class="pct-bar">
                <div class="pct-fill" [style.width]="revenueWidth(s.monthlyRevenue || 0)" style="background:var(--amber)"></div>
              </div>
            </div>
          }
        </div>
      </div>
    </ng-template>
  `
})
export class AdminComponent implements OnInit {
  auth = inject(AuthService);
  shopSvc = inject(ShopService);
  bookSvc = inject(BookingService);
  toast = inject(ToastService);

  tab = signal<Tab>('overview');
  shops = signal<ShopResponse[]>([]);
  bookings = signal<BookingResponse[]>([]);
  stats = signal<DashboardStats | null>(null);
  shopFilter = signal('');
  bkFilter = signal('');
  commissionShop = signal<ShopResponse | null>(null);
  newCommission = 10;

  nav = [
    { tab: 'overview'  as Tab, icon: '📊', label: 'Overview' },
    { tab: 'shops'     as Tab, icon: '🏪', label: 'Shops' },
    { tab: 'bookings'  as Tab, icon: '📅', label: 'Bookings' },
    { tab: 'revenue'   as Tab, icon: '💰', label: 'Revenue' },
  ];

  shopFilters = [
    { val: '', label: 'All' },
    { val: 'ACTIVE', label: '🟢 Active' },
    { val: 'PENDING', label: '⏳ Pending' },
    { val: 'DISABLED', label: '⛔ Disabled' },
  ];

  bkFilters = [
    { val: '', label: 'All' },
    { val: 'pending', label: '⏳ Pending' },
    { val: 'confirmed', label: '✓ Confirmed' },
    { val: 'completed', label: '🏁 Completed' },
    { val: 'cancelled', label: 'Cancelled' },
  ];

  get todayDate() { return new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' }); }
  pendingShops() { return this.shops().filter(s => s.status === 'PENDING').length; }
  pendingShopsPreview() { return this.shops().filter(s => s.status === 'PENDING').slice(0, 3); }
  filteredShops() { return this.shopFilter() ? this.shops().filter(s => s.status === this.shopFilter()) : this.shops(); }
  filteredBookings() { return this.bkFilter() ? this.bookings().filter(b => b.status === this.bkFilter()) : this.bookings(); }
  shopsWithRevenue() { return this.shops().filter(s => (s.monthlyRevenue || 0) > 0).sort((a, b) => (b.monthlyRevenue || 0) - (a.monthlyRevenue || 0)); }
  maxRevenue() { return Math.max(...this.shops().map(s => s.monthlyRevenue || 0), 1); }
  revenueWidth(v: number) { return Math.round((v / this.maxRevenue()) * 100) + '%'; }

  ngOnInit() {
    this.shopSvc.adminGetAllShops().subscribe({ next: r => this.shops.set(r.data || []) });
    this.bookSvc.adminGetAllBookings().subscribe({ next: r => this.bookings.set(r.data || []) });
    this.bookSvc.adminGetStats().subscribe({ next: r => this.stats.set(r.data) });
  }

  approve(id: number) {
    this.shopSvc.adminApprove(id).subscribe({ next: r => {
      this.shops.update(s => s.map(x => x.id === id ? r.data : x));
      this.toast.ok('Shop approved ✅', 'Barber notified via WhatsApp');
    }});
  }

  disable(id: number) {
    this.shopSvc.adminDisable(id).subscribe({ next: r => {
      this.shops.update(s => s.map(x => x.id === id ? r.data : x));
      this.toast.warn('Shop disabled');
    }});
  }

  enable(id: number) {
    this.shopSvc.adminEnable(id).subscribe({ next: r => {
      this.shops.update(s => s.map(x => x.id === id ? r.data : x));
      this.toast.ok('Shop re-enabled ✅');
    }});
  }

  openCommission(s: ShopResponse) {
    this.commissionShop.set(s);
    this.newCommission = s.commissionPercent || 10;
  }

  saveCommission() {
    const s = this.commissionShop();
    if (!s) return;
    this.shopSvc.adminSetCommission(s.id, this.newCommission).subscribe({ next: r => {
      this.shops.update(list => list.map(x => x.id === s.id ? r.data : x));
      this.commissionShop.set(null);
      this.toast.ok('Commission updated');
    }});
  }
}
