import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { AuthModalComponent } from '../auth/auth-modal.component';
import { PolicyPageComponent } from '../policy/policy-page.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FooterComponent, AuthModalComponent, PolicyPageComponent],
  template: `
    <!-- Policy overlay -->
    @if (policyType()) {
      <app-policy-page [type]="policyType()!" (back)="policyType.set(null)"></app-policy-page>
    } @else {

    <div class="landing" style="display:flex;flex-direction:column;min-height:100vh">
      <div class="landing-noise"></div>
      <div class="landing-glow-1"></div>
      <div class="landing-glow-2"></div>
      <div class="landing-glow-3"></div>

      <!-- NAV -->
      <nav class="landing-nav">
        <div class="brand">TRIM<span>LY</span></div>
        <div class="nav-btns">
          <button class="btn btn-ghost btn-sm" (click)="openAuth('barber')">For Barbers</button>
          <button class="btn btn-amber btn-sm" (click)="openAuth('customer')">Book Now</button>
        </div>
      </nav>

      <!-- HERO -->
      <section class="landing-hero" style="flex:1">
        <div class="hero-eyebrow anim-fade-up">
          <span>✂️</span> INDIA'S SMARTEST BARBERSHOP PLATFORM
        </div>
        <h1 class="hero-title anim-fade-up-1">
          <div class="hero-title-line1">SKIP THE</div>
          <div class="hero-title-line2">QUEUE.</div>
          <div class="hero-title-line1" style="font-size:0.55em;letter-spacing:-1px;margin-top:0.1em">BOOK YOUR CHAIR</div>
        </h1>
        <p class="hero-sub anim-fade-up-2">
          Choose your barber, pick your exact time slot, and walk in when it's your turn.
          Zero wait. Pure style.
        </p>
        <div class="hero-btns anim-fade-up-3">
          <button class="btn btn-amber btn-lg" (click)="openAuth('customer')">🎯 Book Appointment</button>
          <button class="btn btn-outline btn-lg" (click)="openAuth('barber')">✂️ Register Your Shop</button>
        </div>
        <div class="hero-stats anim-fade-up-4">
          @for (stat of stats; track stat.val; let i = $index) {
            <div style="display:flex;align-items:center;gap:48px">
              @if (i > 0) { <div class="hero-stat-sep"></div> }
              <div style="text-align:center">
                <div class="hero-stat-val">{{ stat.val }}</div>
                <div class="hero-stat-label">{{ stat.label }}</div>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- FEATURES -->
      <section class="landing-features">
        <div class="features-title">WHY TRIMLY?</div>
        <div class="features-sub">Everything you need for a frictionless barbershop experience</div>
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

      <!-- ROLE CARDS -->
      <section class="role-section">
        <div class="features-title" style="margin-bottom:12px">GET STARTED</div>
        <div class="features-sub">Choose how you want to use Trimly</div>
        <div class="role-cards-row">
          @for (role of roles; track role.title) {
            <div class="role-entry-card" (click)="openAuth(role.key)">
              <div class="rec-banner" [style.background]="role.bg">{{ role.emoji }}</div>
              <div class="rec-body">
                <div class="rec-title">{{ role.title }}</div>
                <div class="rec-desc">{{ role.desc }}</div>
                <div class="rec-cta">{{ role.cta }} →</div>
              </div>
            </div>
          }
        </div>
      </section>

      <app-footer (policyClick)="policyType.set($event)"></app-footer>
    </div>

    <!-- AUTH MODAL -->
    @if (authRole()) {
      <app-auth-modal [role]="authRole()!" (close)="authRole.set(null)"></app-auth-modal>
    }

    }
  `,
  styles: [`
    .landing-nav { position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:0 32px;height:60px;background:rgba(6,6,10,0.85);backdrop-filter:blur(12px);border-bottom:1px solid var(--border); }
    .brand { font-family:'Unbounded',sans-serif;font-size:20px;font-weight:900;letter-spacing:1px;color:var(--text) }
    .brand span { color:var(--amber) }
    .nav-btns { display:flex;align-items:center;gap:8px }
    .landing-glow-1 { position:absolute;width:700px;height:700px;border-radius:50%;background:radial-gradient(circle,rgba(245,166,35,0.08) 0%,transparent 70%);top:-200px;left:-200px;pointer-events:none; }
    .landing-glow-2 { position:absolute;width:500px;height:500px;border-radius:50%;background:radial-gradient(circle,rgba(139,92,246,0.06) 0%,transparent 70%);bottom:-100px;right:-100px;pointer-events:none; }
    .landing-glow-3 { position:absolute;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(16,217,138,0.05) 0%,transparent 70%);top:40%;left:50%;transform:translate(-50%,-50%);pointer-events:none; }
    .landing-hero { position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 24px 60px;text-align:center; }
    .hero-eyebrow { display:inline-flex;align-items:center;gap:8px;padding:6px 16px;border-radius:30px;border:1px solid rgba(245,166,35,0.25);background:var(--amber-dim);font-size:12px;font-weight:600;color:var(--amber);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:28px; }
    .hero-title { font-family:'Unbounded',sans-serif;font-size:clamp(40px,7vw,88px);font-weight:900;line-height:0.95;letter-spacing:-3px;margin-bottom:24px; }
    .hero-title-line1 { color:var(--text); }
    .hero-title-line2 { color:transparent;background:linear-gradient(135deg,var(--amber),var(--amber2),#ff9500);-webkit-background-clip:text;background-clip:text; }
    .hero-sub { font-size:clamp(15px,2vw,18px);color:var(--text2);max-width:520px;line-height:1.7;margin-bottom:48px; }
    .hero-btns { display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin-bottom:64px; }
    .hero-stats { display:flex;gap:48px;align-items:center;flex-wrap:wrap;justify-content:center; }
    .hero-stat-val { font-family:'Unbounded',sans-serif;font-size:32px;font-weight:900;color:var(--amber); }
    .hero-stat-label { font-size:12px;color:var(--text3);margin-top:2px; }
    .hero-stat-sep { width:1px;height:40px;background:var(--border2); }
    .landing-features { padding:80px 48px;position:relative;z-index:1;border-top:1px solid var(--border); }
    .features-title { font-family:'Unbounded',sans-serif;font-size:clamp(24px,4vw,40px);font-weight:900;text-align:center;margin-bottom:12px; }
    .features-sub { text-align:center;color:var(--text2);margin-bottom:56px; }
    .features-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:1000px;margin:0 auto; }
    .feature-card { background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:28px;transition:all .3s;position:relative;overflow:hidden; }
    .feature-card::before { content:'';position:absolute;inset:0;opacity:0;transition:opacity .3s;background:linear-gradient(135deg,var(--amber-dim),transparent); }
    .feature-card:hover { border-color:rgba(245,166,35,0.25);transform:translateY(-4px);box-shadow:var(--shadow-md); }
    .feature-card:hover::before { opacity:1; }
    .feature-icon { width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:26px;margin-bottom:18px;background:var(--amber-dim);border:1px solid rgba(245,166,35,0.18);position:relative;z-index:1; }
    .feature-title { font-family:'Unbounded',sans-serif;font-size:14px;font-weight:700;margin-bottom:8px;position:relative;z-index:1; }
    .feature-desc { font-size:13px;color:var(--text2);line-height:1.65;position:relative;z-index:1; }
    .role-section { padding:80px 48px;background:var(--surface);border-top:1px solid var(--border);border-bottom:1px solid var(--border);position:relative;z-index:1; }
    .role-cards-row { display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:900px;margin:0 auto; }
    .role-entry-card { border-radius:var(--r);overflow:hidden;cursor:pointer;transition:all .3s;border:2px solid var(--border);background:var(--card); }
    .role-entry-card:hover { border-color:var(--amber);transform:translateY(-6px);box-shadow:0 20px 60px rgba(245,166,35,0.15); }
    .rec-banner { height:90px;display:flex;align-items:center;justify-content:center;font-size:42px;position:relative;overflow:hidden; }
    .rec-body { padding:20px; }
    .rec-title { font-family:'Unbounded',sans-serif;font-size:15px;font-weight:700;margin-bottom:6px; }
    .rec-desc { font-size:12px;color:var(--text2);line-height:1.6; }
    .rec-cta { margin-top:14px;display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--amber); }
    @media(max-width:760px){ .features-grid,.role-cards-row{grid-template-columns:1fr;} .landing-features,.role-section{padding:48px 18px;} }
  `]
})
export class LandingComponent {
  auth = inject(AuthService);
  router = inject(Router);

  authRole = signal<'customer' | 'barber' | 'admin' | null>(null);
  policyType = signal<string | null>(null);

  stats = [
    { val: '500+', label: 'Bookings/month' },
    { val: '50+',  label: 'Partner Shops' },
    { val: '4.8★', label: 'Avg Rating' },
    { val: '0',    label: 'Queue Time' },
  ];

  features = [
    { icon: '📅', title: 'INSTANT BOOKING',    desc: 'Book your exact slot in seconds. No calls, no waiting, no uncertainty.' },
    { icon: '💬', title: 'WHATSAPP UPDATES',   desc: 'Get real-time booking confirmations and reminders on WhatsApp.' },
    { icon: '💺', title: 'SEAT-AWARE SLOTS',   desc: 'Multi-seat shops show real availability. Never get double-booked.' },
    { icon: '📊', title: 'LIVE ANALYTICS',     desc: 'Track revenue, bookings, ratings and commissions in real-time.' },
    { icon: '📍', title: 'NEARBY SHOPS',       desc: 'Find barbershops near you on a live map with distance badges.' },
    { icon: '⭐', title: 'VERIFIED REVIEWS',   desc: 'Ratings from real customers only — no fake reviews.' },
  ];

  roles = [
    { key: 'customer' as const, emoji: '💈', title: 'BOOK A CUT',      bg: 'linear-gradient(135deg,#1a1200,#0d0d1a)', desc: 'Browse nearby barbershops, pick a time and walk in without waiting.', cta: 'Book Now' },
    { key: 'barber'   as const, emoji: '✂️', title: 'LIST YOUR SHOP',  bg: 'linear-gradient(135deg,#0f0a1a,#0d0d1a)', desc: 'Accept bookings, manage your schedule and grow your barbershop business.', cta: 'Get Started' },
    { key: 'admin'    as const, emoji: '👑', title: 'ADMIN PANEL',     bg: 'linear-gradient(135deg,#1a0f00,#0d0a00)', desc: 'Manage all shops, approve registrations and monitor platform health.', cta: 'Admin Login' },
  ];

  openAuth(role: 'customer' | 'barber' | 'admin'): void {
    // If already logged in, redirect
    if (this.auth.isLoggedIn()) {
      this.redirectByRole();
      return;
    }
    this.authRole.set(role);
  }

  private redirectByRole(): void {
    if (this.auth.isAdmin())    this.router.navigate(['/admin']);
    else if (this.auth.isBarber()) this.router.navigate(['/barber']);
    else this.router.navigate(['/customer']);
  }
}
