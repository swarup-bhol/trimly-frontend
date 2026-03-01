import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { ToastService } from '../../core/services/toast.service';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { PolicyPageComponent } from '../policy/policy-page.component';
import { BookingResponse } from '../../core/models/models';
import { CustomerBrowseComponent } from './browse/customer-browse.component';
import { CustomerHistoryComponent } from './history/customer-history.component';
import { CustomerNotificationsComponent } from './notifications/customer-notifications.component';
import { BookingFlowComponent } from './booking/booking-flow.component';

type Tab = 'browse' | 'history' | 'notif';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [
    CommonModule, TopbarComponent, FooterComponent, PolicyPageComponent,
    CustomerBrowseComponent, CustomerHistoryComponent, CustomerNotificationsComponent,
    BookingFlowComponent
  ],
  template: `
    @if (policyType()) {
      <app-policy-page [type]="policyType()!" (back)="policyType.set(null)"></app-policy-page>
    } @else if (bookingShopId()) {
      <app-booking-flow [shopId]="bookingShopId()!" (done)="onBookingDone($event)" (back)="bookingShopId.set(null)"></app-booking-flow>
    } @else {
      <div style="display:flex;flex-direction:column;min-height:100vh">
        <app-topbar [notifCount]="pendingNotifs()" (notifClick)="tab.set('notif')"></app-topbar>

        <!-- Desktop tab bar -->
        <div class="desk-tabs">
          @for (n of navItems; track n.tab) {
            <button class="dt" [class.on]="tab() === n.tab" (click)="tab.set(n.tab)">
              <span>{{ n.icon }}</span>
              {{ n.label }}
              @if (n.tab === 'notif' && pendingNotifs() > 0) {
                <span class="dt-badge">{{ pendingNotifs() }}</span>
              }
            </button>
          }
        </div>

        <div class="main" style="flex:1">
          @if (tab() === 'browse') {
            <app-customer-browse (bookShop)="bookingShopId.set($event)"></app-customer-browse>
          }
          @if (tab() === 'history') {
            <app-customer-history [bookings]="myBookings()" (refresh)="loadBookings()"></app-customer-history>
          }
          @if (tab() === 'notif') {
            <app-customer-notifications [bookings]="myBookings()" (action)="loadBookings()"></app-customer-notifications>
          }
        </div>

        <!-- Desktop footer -->
        <div class="hide-mobile">
          <app-footer (policyClick)="policyType.set($event)"></app-footer>
        </div>

        <!-- Mobile bottom nav -->
        <nav class="mobile-nav">
          @for (n of navItems; track n.tab) {
            <button class="mni" [class.on]="tab() === n.tab" (click)="tab.set(n.tab)">
              @if (n.tab === 'notif' && pendingNotifs() > 0) {
                <span class="mni-badge">{{ pendingNotifs() }}</span>
              }
              <span class="mni-icon">{{ n.icon }}</span>{{ n.label }}
            </button>
          }
        </nav>
      </div>
    }
  `,
  styles: [`
    .hide-mobile { @media(max-width:760px) { display:none; } }

    .desk-tabs {
      display: flex;
      gap: 4px;
      padding: 10px 24px 0;
      border-bottom: 1px solid var(--border);
      background: var(--bg);
      @media(max-width:760px) { display: none; }
    }

    .dt {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border: none;
      background: none;
      color: var(--text3);
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: all 0.15s;
      position: relative;
      border-radius: 8px 8px 0 0;
      &:hover { color: var(--text1); background: var(--card); }
      &.on {
        color: var(--amber);
        border-bottom-color: var(--amber);
        background: var(--amber-dim);
      }
    }

    .dt-badge {
      background: var(--crimson);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 10px;
      min-width: 18px;
      text-align: center;
    }
  `]
})
export class CustomerComponent implements OnInit {
  auth = inject(AuthService);
  bookingSvc = inject(BookingService);
  toast = inject(ToastService);

  tab = signal<Tab>('browse');
  myBookings = signal<BookingResponse[]>([]);
  bookingShopId = signal<number | null>(null);
  policyType = signal<string | null>(null);
  pendingNotifs = signal(0);

  navItems = [
    { tab: 'browse'  as Tab, icon: '🔍', label: 'Browse' },
    { tab: 'history' as Tab, icon: '📅', label: 'My Bookings' },
    { tab: 'notif'   as Tab, icon: '🔔', label: 'Notifications' },
  ];

  ngOnInit() { this.loadBookings(); }

  loadBookings() {
    this.bookingSvc.getMyBookings().subscribe({
      next: res => {
        this.myBookings.set(res.data || []);
        this.pendingNotifs.set(
          (res.data || []).filter(b =>
            b.rescheduleStatus === 'PENDING' || b.status === 'PENDING'
          ).length
        );
      },
      error: () => {}
    });
  }

  onBookingDone(success: boolean) {
    this.bookingShopId.set(null);
    if (success) {
      this.loadBookings();
      this.tab.set('history');
    }
  }
}
