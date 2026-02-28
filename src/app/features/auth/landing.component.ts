import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

type AuthRole = 'customer' | 'barber' | 'admin' | null;

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="landing">
  <div class="landing-noise"></div>
  <div class="landing-glow-1"></div>
  <div class="landing-glow-2"></div>
  <div class="landing-glow-3"></div>

  <!-- NAV -->
  <nav class="landing-nav">
    <div class="brand">TRIM<span class="sub-brand">LY</span></div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-outline btn-sm" (click)="openAuth('barber')">Barber Login</button>
      <button class="btn btn-amber btn-sm" (click)="openAuth('customer')">Book Now</button>
    </div>
  </nav>

  <!-- HERO -->
  <section class="landing-hero">
    <div class="hero-eyebrow anim-fade-up">✂️ &nbsp; Instant Barber Booking</div>
    <h1 class="hero-title anim-fade-up-1">
      <span class="hero-title-line1">SKIP THE</span>
      <span class="hero-title-line2">QUEUE.</span>
    </h1>
    <p class="hero-sub anim-fade-up-2">Book your barber slot in seconds. No calls, no waiting — pick your time, walk in fresh.</p>
    <div class="hero-btns anim-fade-up-3">
      <button class="btn btn-amber btn-lg" (click)="openAuth('customer')">🗓 Book a Cut</button>
      <button class="btn btn-outline btn-lg" (click)="openAuth('barber')">✂️ I'm a Barber</button>
    </div>
    <div class="hero-stats anim-fade-up-4">
      @for (stat of stats; track stat.label; let i = $index) {
        @if (i > 0) { <div class="hero-stat-sep"></div> }
        <div style="text-align:center">
          <div class="hero-stat-val">{{ stat.val }}</div>
          <div class="hero-stat-label">{{ stat.label }}</div>
        </div>
      }
    </div>
  </section>

  <!-- FEATURES -->
  <section class="landing-features">
    <h2 class="features-title">Everything you need</h2>
    <p class="features-sub">Powerful tools for barbers, seamless booking for customers</p>
    <div class="features-grid">
      @for (f of features; track f.title) {
        <div class="feature-card">
          <div class="feature-icon">{{ f.icon }}</div>
          <div class="feature-title">{{ f.title }}</div>
          <div class="feature-desc">{{ f.desc }}</div>
        </div>
      }
    </div>
  </section>

  <!-- ROLE SECTION -->
  <section class="role-section">
    <h2 class="features-title" style="margin-bottom:8px">Who are you?</h2>
    <p class="features-sub" style="margin-bottom:40px">Choose your experience</p>
    <div class="role-cards-row">
      @for (r of roles; track r.role) {
        <div class="role-entry-card" (click)="openAuth(r.role)">
          <div class="rec-banner" [style.background]="r.bg">
            <span style="font-size:48px">{{ r.icon }}</span>
          </div>
          <div class="rec-body">
            <div class="rec-title">{{ r.title }}</div>
            <div class="rec-desc">{{ r.desc }}</div>
            <div class="rec-cta">{{ r.cta }} →</div>
          </div>
        </div>
      }
    </div>
  </section>
</div>

<!-- AUTH MODAL -->
@if (authRole()) {
  <div class="auth-overlay" (click)="closeAuth()">
    <div class="auth-box" (click)="$event.stopPropagation()">
      <div class="auth-box-head">
        <div class="auth-box-logo">TRIMLY</div>
        <div class="auth-box-title">{{ authTitle() }}</div>
        <div class="auth-box-sub">{{ authSub() }}</div>
      </div>
      <div class="auth-box-body">

        <!-- ROLE TABS (login only) -->
        @if (!isReg()) {
          <div class="role-tabs">
            @for (tab of roleTabs; track tab.role) {
              <button class="role-tab" [class.active]="authRole() === tab.role" (click)="switchRole(tab.role)">
                <span class="rt-icon">{{ tab.icon }}</span>{{ tab.label }}
              </button>
            }
          </div>
        }

        <!-- CUSTOMER LOGIN -->
        @if (!isReg() && authRole() === 'customer') {
          <div class="fg">
            <label class="fl">Your Name</label>
            <input class="fi" placeholder="Arjun Mehta" [(ngModel)]="form.name" (keydown.enter)="submit()" />
          </div>
          <div class="fg">
            <label class="fl">Phone Number</label>
            <div class="fi-icon">
              <span class="fii">📱</span>
              <input class="fi" placeholder="+91 98765 43210" [(ngModel)]="form.phone" (keydown.enter)="submit()" />
            </div>
          </div>
        }

        <!-- BARBER / ADMIN LOGIN -->
        @if (!isReg() && (authRole() === 'barber' || authRole() === 'admin')) {
          <div class="fg">
            <label class="fl">Email</label>
            <div class="fi-icon">
              <span class="fii">✉️</span>
              <input class="fi" type="email" [placeholder]="authRole() === 'admin' ? 'admin@trimly.app' : 'yourshop@email.com'" [(ngModel)]="form.email" />
            </div>
          </div>
          <div class="fg">
            <label class="fl">Password</label>
            <div class="fi-icon">
              <span class="fii">🔑</span>
              <input class="fi" type="password" placeholder="••••••••" [(ngModel)]="form.password" (keydown.enter)="submit()" />
            </div>
          </div>
          <div style="font-size:11px;color:var(--text3);margin-bottom:14px;padding:8px 12px;background:rgba(255,255,255,0.03);border-radius:8px;border:1px solid var(--border)">
            {{ authRole() === 'admin' ? 'Demo: admin@trimly.app / admin123' : 'Demo: rajan@blade.com / 1234' }}
          </div>
        }

        <!-- REGISTER STEP 1 -->
        @if (isReg() && regStep() === 1) {
          <div class="fr">
            <div class="fg"><label class="fl">Owner Name *</label><input class="fi" placeholder="Your full name" [(ngModel)]="form.owner" /></div>
            <div class="fg"><label class="fl">Phone</label><input class="fi" placeholder="+91..." [(ngModel)]="form.phone" /></div>
          </div>
          <div class="fg"><label class="fl">Shop Name *</label><input class="fi" placeholder="e.g. Blade & Co." [(ngModel)]="form.shopName" /></div>
          <div class="fg"><label class="fl">Location *</label><input class="fi" placeholder="Area, City" [(ngModel)]="form.location" /></div>
          <button class="btn btn-amber btn-block" (click)="nextStep()">Next →</button>
        }

        <!-- REGISTER STEP 2 -->
        @if (isReg() && regStep() === 2) {
          <div class="fg"><label class="fl">Email *</label><input class="fi" type="email" placeholder="shop@email.com" [(ngModel)]="form.email" /></div>
          <div class="fg"><label class="fl">Password *</label><input class="fi" type="password" placeholder="Create a password (min 6 chars)" [(ngModel)]="form.password" /></div>
          <div style="display:flex;gap:10px">
            <button class="btn btn-outline" (click)="regStep.set(1)">← Back</button>
            <button class="btn btn-amber" style="flex:1" [disabled]="loading()" (click)="submit()">
              {{ loading() ? 'Submitting...' : 'Submit for Approval' }}
            </button>
          </div>
        }

        <!-- ERROR -->
        @if (errMsg()) {
          <div [class]="errMsg()!.startsWith('✅') ? 'info-banner' : 'err-banner'" style="margin-top:12px">
            {{ errMsg() }}
          </div>
        }

        <!-- SUBMIT BUTTON (login) -->
        @if (!isReg()) {
          <button class="btn btn-amber btn-block" style="margin-top:18px" [disabled]="loading()" (click)="submit()">
            @if (loading()) { <span class="spinner" style="width:16px;height:16px;border-width:2px"></span> }
            {{ authRole() === 'customer' ? 'Browse Barbers →' : 'Sign In' }}
          </button>
        }

        <!-- REGISTER TOGGLE -->
        @if (authRole() === 'barber' && !isReg()) {
          <div class="dt"><span>New barber?</span></div>
          <button class="btn btn-outline btn-block" (click)="startReg()">Register Your Shop</button>
        }
        @if (isReg()) {
          <div style="text-align:center;margin-top:14px">
            <button class="btn btn-ghost btn-sm" (click)="stopReg()">← Back to Login</button>
          </div>
        }
      </div>
    </div>
  </div>
}
  `
})
export class LandingComponent {
  private authSvc = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  authRole = signal<AuthRole>(null);
  isReg = signal(false);
  regStep = signal(1);
  loading = signal(false);
  errMsg = signal<string | null>(null);

  form = { name: '', phone: '', email: '', password: '', owner: '', shopName: '', location: '' };

  stats = [
    { val: '2,400+', label: 'Bookings Made' },
    { val: '150+', label: 'Partner Shops' },
    { val: '4.9★', label: 'Avg Rating' },
    { val: '0 Calls', label: 'Needed' }
  ];

  features = [
    { icon: '⚡', title: 'Instant Booking', desc: 'Customers book in seconds — no calls, no waiting, just pick a slot and walk in at your time.' },
    { icon: '📱', title: 'In-App Alerts', desc: 'Barbers get instant notifications for every booking request. Never miss a customer.' },
    { icon: '💰', title: 'Transparent Pricing', desc: 'All services listed with clear prices. Customers see exactly what they\'re paying.' },
    { icon: '🎯', title: 'Smart Scheduling', desc: 'Multi-service booking automatically calculates total duration and blocks the right slots.' },
    { icon: '📊', title: 'Live Analytics', desc: 'Track revenue, bookings, ratings and commissions in real-time from your dashboard.' },
    { icon: '🔗', title: 'Shop Share Link', desc: 'Every barber gets a unique booking URL to share with loyal customers directly.' }
  ];

  roles = [
    { role: 'customer' as AuthRole, icon: '👤', title: "I'm a Customer", desc: 'Browse local barber shops, see live availability, book your slot and skip the queue entirely.', bg: 'linear-gradient(135deg,#1a1200,#0a0a14)', cta: 'Browse & Book' },
    { role: 'barber' as AuthRole, icon: '✂️', title: "I'm a Barber", desc: 'Manage your shop, services, schedule and bookings. Get paid more by removing walk-in chaos.', bg: 'linear-gradient(135deg,#0f1a0f,#0a0a14)', cta: 'Open Your Shop' },
    { role: 'admin' as AuthRole, icon: '🏛', title: 'Platform Admin', desc: 'Approve shops, monitor commissions, track all bookings and revenue across the entire network.', bg: 'linear-gradient(135deg,#1a0f1a,#0a0a14)', cta: 'Admin Access' }
  ];

  roleTabs = [
    { role: 'customer' as AuthRole, icon: '👤', label: 'Customer' },
    { role: 'barber' as AuthRole, icon: '✂️', label: 'Barber' },
    { role: 'admin' as AuthRole, icon: '🏛', label: 'Admin' }
  ];

  openAuth(role: AuthRole): void { this.authRole.set(role); this.errMsg.set(null); this.resetForm(); }
  closeAuth(): void { this.authRole.set(null); this.isReg.set(false); this.regStep.set(1); this.errMsg.set(null); }
  switchRole(role: AuthRole): void { this.authRole.set(role); this.errMsg.set(null); }
  startReg(): void { this.isReg.set(true); this.errMsg.set(null); this.regStep.set(1); }
  stopReg(): void { this.isReg.set(false); this.errMsg.set(null); this.regStep.set(1); }

  authTitle(): string {
    if (this.isReg()) return 'Register Shop';
    return this.authRole() === 'customer' ? 'Book a Cut' : this.authRole() === 'admin' ? 'Admin Login' : 'Shop Login';
  }

  authSub(): string {
    if (this.isReg()) return 'Create your barber shop account — pending admin approval';
    return this.authRole() === 'customer' ? 'No account needed. Just your name and phone.' :
           this.authRole() === 'admin' ? 'Platform administrator access' : 'Sign in to your barber dashboard';
  }

  nextStep(): void {
    if (!this.form.shopName.trim() || !this.form.owner.trim()) { this.errMsg.set('Please fill required fields'); return; }
    if (!this.form.location.trim()) { this.errMsg.set('Please enter location'); return; }
    this.errMsg.set(null);
    this.regStep.set(2);
  }

  submit(): void {
    this.errMsg.set(null);
    const role = this.authRole();

    if (this.isReg()) {
      if (!this.form.email.trim() || !this.form.password.trim()) { this.errMsg.set('Fill all required fields'); return; }
      if (this.form.password.length < 6) { this.errMsg.set('Password must be at least 6 characters'); return; }
      this.loading.set(true);
      this.authSvc.registerBarber({
        ownerName: this.form.owner,
        email: this.form.email,
        password: this.form.password,
        shopName: this.form.shopName,
        location: this.form.location,
        phone: this.form.phone
      }).subscribe({
        next: () => { this.loading.set(false); this.router.navigate(['/barber']); },
        error: (e) => { this.loading.set(false); this.errMsg.set(e.error?.message || 'Registration failed'); }
      });
      return;
    }

    if (role === 'customer') {
      if (!this.form.name.trim() || !this.form.phone.trim()) { this.errMsg.set('Please enter your name and phone number'); return; }
      this.loading.set(true);
      this.authSvc.loginCustomer(this.form.name.trim(), this.form.phone.trim()).subscribe({
        next: () => { this.loading.set(false); this.router.navigate(['/customer']); },
        error: (e) => { this.loading.set(false); this.errMsg.set(e.error?.message || 'Login failed'); }
      });
    } else if (role === 'barber') {
      if (!this.form.email || !this.form.password) { this.errMsg.set('Enter email and password'); return; }
      this.loading.set(true);
      this.authSvc.loginBarber(this.form.email, this.form.password).subscribe({
        next: () => { this.loading.set(false); this.router.navigate(['/barber']); },
        error: (e) => { this.loading.set(false); this.errMsg.set(e.error?.message || 'Invalid credentials'); }
      });
    } else if (role === 'admin') {
      if (!this.form.email || !this.form.password) { this.errMsg.set('Enter email and password'); return; }
      this.loading.set(true);
      this.authSvc.loginAdmin(this.form.email, this.form.password).subscribe({
        next: () => { this.loading.set(false); this.router.navigate(['/admin']); },
        error: (e) => { this.loading.set(false); this.errMsg.set(e.error?.message || 'Invalid credentials'); }
      });
    }
  }

  private resetForm(): void {
    this.form = { name: '', phone: '', email: '', password: '', owner: '', shopName: '', location: '' };
  }
}
