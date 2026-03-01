import {
  Component, inject, signal, Output, EventEmitter, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShopService } from '../../../core/services/shop.service';
import { AuthService } from '../../../core/services/auth.service';
import { ShopResponse, LocationMeta } from '../../../core/models/models';

declare const L: any;

@Component({
  selector: 'app-customer-browse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page anim-fade-up">

      <!-- Greeting with inline name edit -->
      <div style="margin-bottom:20px;padding:20px 24px;background:var(--card);border-radius:16px;border:1px solid var(--border)">
        @if (!editingName()) {
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-size:12px;color:var(--text3);margin-bottom:4px">Welcome back 👋</div>
              <div style="font-family:'Unbounded',sans-serif;font-size:20px;font-weight:700">
                Hi, {{ auth.user()?.fullName || 'Anonymous' }}!
              </div>
            </div>
            <button (click)="startEditName()"
              style="padding:8px 14px;border-radius:20px;border:1px solid var(--border2);background:var(--card2);color:var(--text2);font-size:12px;cursor:pointer;display:flex;align-items:center;gap:6px">
              ✏️ {{ auth.user()?.fullName ? 'Edit name' : 'Set your name' }}
            </button>
          </div>
        } @else {
          <div style="display:flex;gap:8px;align-items:center">
            <input #nameInput class="fi" [(ngModel)]="editName"
              placeholder="Your name"
              (keyup.enter)="saveName()"
              (keyup.escape)="editingName.set(false)"
              style="flex:1;margin-bottom:0">
            <button class="btn btn-amber btn-sm" [disabled]="savingName()" (click)="saveName()">
              {{ savingName() ? '...' : 'Save' }}
            </button>
            <button class="btn btn-ghost btn-sm" (click)="editingName.set(false)">Cancel</button>
          </div>
        }
      </div>

      <div class="ph">
        <div class="ph-row">
          <div>
            <div class="ph-title">Find Your Barber ✂️</div>
            <div class="ph-sub">{{ filtered().length }} shops available {{ cityFilter() ? 'in ' + cityFilter() : '' }}</div>
          </div>
          <button class="loc-chip" (click)="toggleNearby()">
            {{ showNearby() ? '📍 Showing Nearby' : '📍 Near Me' }}
          </button>
        </div>
      </div>

      <!-- Search + filters -->
      <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap">
        <input class="fi" [(ngModel)]="q" (ngModelChange)="applyFilters()"
          placeholder="🔍 Search shops..." style="flex:2;min-width:180px">
        <select class="fi" [(ngModel)]="cityFilter" (ngModelChange)="onCityChange()" style="flex:1;min-width:120px">
          <option value="">All Cities</option>
          @for (c of meta()?.cities || []; track c) {
            <option [value]="c">{{ c }}</option>
          }
        </select>
      </div>

      <!-- Area pills -->
      @if (cityFilter() && areasForCity().length > 0) {
        <div class="area-pills" style="margin-bottom:14px">
          <button class="area-pill" [class.on]="!areaFilter()" (click)="areaFilter.set(''); applyFilters()">All Areas</button>
          @for (a of areasForCity(); track a) {
            <button class="area-pill" [class.on]="areaFilter() === a" (click)="areaFilter.set(a); applyFilters()">{{ a }}</button>
          }
        </div>
      }

      <!-- Nearby map -->
      @if (showNearby()) {
        <div class="anim-fade-up" style="margin-bottom:16px">
          <div #mapEl style="height:280px;border-radius:14px;overflow:hidden;border:1px solid var(--border)"></div>
        </div>
      }

      <!-- Shop grid -->
      @if (loading()) {
        <div class="g3">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div style="background:var(--card);border-radius:18px;height:220px;border:1px solid var(--border);animation:pulse 1.5s infinite"></div>
          }
        </div>
      } @else if (filtered().length === 0) {
        <div class="empty">
          <div class="ei">✂️</div>
          <div class="et">No shops found. Try a different search or city.</div>
        </div>
      } @else {
        <div class="g3">
          @for (shop of filtered(); track shop.id) {
            <div class="shop-card" [class.closed]="!shop.open" (click)="book(shop)">
              <div class="sc-banner" [style.background]="'linear-gradient(135deg,' + (shop.color1 || '#1a1200') + ',' + (shop.color2 || '#0d0d1a') + ')'">
                <span class="sc-emoji">{{ shop.emoji || '✂️' }}</span>
                <span style="position:absolute;top:10px;right:10px" class="badge" [class]="shop.open ? 'bg' : 'br'">
                  {{ shop.open ? '● Open' : '● Closed' }}
                </span>
              </div>
              <div class="sc-body">
                <div class="sc-name">{{ shop.shopName }}</div>
                <div class="sc-loc">📍 {{ shop.location }}
                  @if (shop.distance) { <span class="dist-badge">{{ shop.distance | number:'1.1-1' }} km</span> }
                </div>
                <div class="sc-pills">
                  @for (svc of (shop.services || []).slice(0,3); track svc.id) {
                    <span class="sc-pill">{{ svc.serviceName }}</span>
                  }
                  @if ((shop.services?.length || 0) > 3) {
                    <span class="sc-pill">+{{ (shop.services?.length || 0) - 3 }} more</span>
                  }
                </div>
                <div class="sc-foot">
                  <div>
                    @if (shop.avgRating) {
                      <div style="display:flex;align-items:center;gap:4px;font-size:13px">
                        <span style="color:var(--amber)">★</span>
                        <b>{{ shop.avgRating | number:'1.1-1' }}</b>
                        <span style="color:var(--text3)">({{ shop.totalReviews }})</span>
                      </div>
                    }
                    <div style="font-size:11px;color:var(--text3);margin-top:2px">
                      From ₹{{ minPrice(shop) }}
                    </div>
                  </div>
                  <button class="btn btn-amber btn-sm" (click)="$event.stopPropagation(); book(shop)">
                    Book →
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class CustomerBrowseComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() bookShop = new EventEmitter<number>();
  @ViewChild('mapEl') mapEl?: ElementRef;

  shopSvc = inject(ShopService);
  auth    = inject(AuthService);

  shops    = signal<ShopResponse[]>([]);
  filtered = signal<ShopResponse[]>([]);
  meta     = signal<LocationMeta | null>(null);
  loading  = signal(true);
  showNearby = signal(false);

  editingName = signal(false);
  savingName  = signal(false);
  editName    = '';

  q = '';
  cityFilter = signal('');
  areaFilter = signal('');

  private map: any;
  private userLat = 0;
  private userLng = 0;

  startEditName() {
    this.editName = this.auth.user()?.fullName || '';
    this.editingName.set(true);
  }

  saveName() {
    if (!this.editName.trim()) return;
    this.savingName.set(true);
    this.auth.updateProfile(this.editName.trim()).subscribe({
      next: () => { this.savingName.set(false); this.editingName.set(false); },
      error: () => { this.savingName.set(false); this.editingName.set(false); }
    });
  }

  ngOnInit() {
    this.shopSvc.getPublicShops().subscribe({
      next: r => { this.shops.set(r.data || []); this.filtered.set(r.data || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.shopSvc.getLocationMeta().subscribe({ next: r => this.meta.set(r.data) });
  }

  ngAfterViewInit() {}

  ngOnDestroy() { this.map?.remove(); }

  applyFilters() {
    let list = this.shops();
    if (this.q) list = list.filter(s => s.shopName.toLowerCase().includes(this.q.toLowerCase()) || s.location.toLowerCase().includes(this.q.toLowerCase()));
    if (this.cityFilter()) list = list.filter(s => s.city === this.cityFilter());
    if (this.areaFilter()) list = list.filter(s => s.area === this.areaFilter());
    if (this.showNearby() && this.userLat) {
      list = list.map(s => ({ ...s, distance: s.latitude && s.longitude ? this.haversine(this.userLat, this.userLng, +s.latitude, +s.longitude) : 999 }))
        .sort((a, b) => (a.distance || 999) - (b.distance || 999))
        .filter(s => (s.distance || 999) < 20);
    }
    this.filtered.set(list);
  }

  onCityChange() { this.areaFilter.set(''); this.applyFilters(); }

  areasForCity(): string[] {
    const city = this.cityFilter();
    const m = this.meta();
    if (!city || !m) return [];
    return m.areasByCity[city] ?? [];
  }

  toggleNearby() {
    if (!this.showNearby()) {
      navigator.geolocation?.getCurrentPosition(pos => {
        this.userLat = pos.coords.latitude;
        this.userLng = pos.coords.longitude;
        this.showNearby.set(true);
        this.applyFilters();
        setTimeout(() => this.initMap(), 100);
      }, () => this.showNearby.set(false));
    } else {
      this.showNearby.set(false);
      this.map?.remove();
      this.map = null;
    }
  }

  private initMap() {
    if (!this.mapEl || typeof L === 'undefined') return;
    this.map?.remove();
    this.map = L.map(this.mapEl.nativeElement, { zoomControl: true }).setView([this.userLat, this.userLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', className: 'dark-tiles'
    }).addTo(this.map);

    // User marker
    L.circleMarker([this.userLat, this.userLng], { radius: 8, color: '#3b9eff', fillColor: '#3b9eff', fillOpacity: 1 })
      .bindPopup('📍 You are here').addTo(this.map);

    // Shop markers
    this.filtered().filter(s => s.latitude && s.longitude).forEach(s => {
      L.marker([+s.latitude!, +s.longitude!], {
        icon: L.divIcon({ className: '', html: `<div style="background:var(--amber);color:#000;font-size:11px;font-weight:800;padding:4px 8px;border-radius:8px;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.4)">${s.shopName}</div>`, iconAnchor: [40, 12] })
      }).bindPopup(`<b>${s.shopName}</b><br/>${s.location}`).addTo(this.map);
    });
  }

  book(shop: ShopResponse) {
    if (!shop.open) return;
    this.bookShop.emit(shop.id);
  }

  minPrice(shop: ShopResponse): number {
    const prices = (shop.services || []).filter(s => s.enabled).map(s => s.price);
    return prices.length ? Math.min(...prices) : 0;
  }

  haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const d = (a: number, b: number) => (b - a) * Math.PI / 180;
    const dLat = d(lat1, lat2), dLng = d(lng1, lng2);
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
