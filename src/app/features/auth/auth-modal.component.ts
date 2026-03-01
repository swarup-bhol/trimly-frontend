import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

type Tab = 'customer' | 'barber' | 'admin';
type Step = 'phone' | 'otp' | 'name' | 'login' | 'register' | 'forgot';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-overlay" (click)="close.emit()">
      <div class="auth-box" (click)="$event.stopPropagation()">

        <div class="auth-box-head">
          <div class="auth-box-logo">TRIM<span style="color:var(--text3);font-weight:400">LY</span></div>
          <div class="auth-box-title">{{ titles[step()] }}</div>
          <div class="auth-box-sub">{{ subs[step()] }}</div>

          <!-- Tab selector -->
          @if (step() === 'phone' || step() === 'login' || step() === 'register') {
            <div class="role-tabs">
              @for (t of tabs; track t.key) {
                <button class="role-tab" [class.active]="activeTab() === t.key" (click)="switchTab(t.key)">
                  <span class="rt-icon">{{ t.icon }}</span>{{ t.label }}
                </button>
              }
            </div>
          }
        </div>

        <div class="auth-box-body">

          <!-- ── CUSTOMER: Enter phone ── -->
          @if (step() === 'phone') {
            <div class="fg">
              <label class="fl">Mobile Number</label>
              <div style="display:flex;gap:8px">
                <div style="background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:11px 15px;color:var(--text3);font-size:14px;white-space:nowrap">🇮🇳 +91</div>
                <input class="fi" [(ngModel)]="phone" type="tel" maxlength="10" placeholder="98765 43210"
                  (keyup.enter)="sendOtp()" style="flex:1">
              </div>
            </div>
            <button class="btn btn-amber btn-block btn-lg" [disabled]="loading() || phone.length !== 10" (click)="sendOtp()">
              {{ loading() ? 'Sending...' : 'Send OTP via WhatsApp 💬' }}
            </button>
            <div class="dt" style="margin-top:16px"><span>Or login as barber / admin</span></div>
            <button class="btn btn-ghost btn-block" (click)="step.set('login'); activeTab.set('barber')">
              Barber / Admin Login →
            </button>
          }

          <!-- ── CUSTOMER: Enter OTP ── -->
          @if (step() === 'otp') {
            <div style="text-align:center;margin-bottom:20px;padding:14px;background:linear-gradient(135deg,#1a2e1a,#0f1f0f);border:1px solid rgba(37,211,102,0.2);border-radius:12px">
              <div style="font-size:22px;margin-bottom:4px">💬</div>
              <div style="font-size:13px;font-weight:700;color:#25d366">OTP sent to +91 {{ phone }}</div>
              <div style="font-size:11px;color:var(--text3);margin-top:2px">Check your WhatsApp</div>
            </div>
            <div class="fg">
              <label class="fl">6-Digit OTP</label>
              <input class="fi" [(ngModel)]="otp" type="tel" maxlength="6" placeholder="• • • • • •"
                style="font-size:24px;letter-spacing:12px;text-align:center;font-weight:700"
                (keyup.enter)="verifyOtp()">
            </div>
            <button class="btn btn-amber btn-block btn-lg" [disabled]="loading() || otp.length !== 6" (click)="verifyOtp()">
              {{ loading() ? 'Verifying...' : 'Verify OTP ✓' }}
            </button>
            <div style="text-align:center;margin-top:12px">
              <button class="btn btn-ghost btn-sm" (click)="step.set('phone'); otp = ''">← Change number</button>
              <button class="btn btn-ghost btn-sm" (click)="resendOtp()" [disabled]="resendCooldown() > 0">
                {{ resendCooldown() > 0 ? 'Resend in ' + resendCooldown() + 's' : 'Resend OTP' }}
              </button>
            </div>
          }

          <!-- ── CUSTOMER: Set name (first time) ── -->
          @if (step() === 'name') {
            <div style="text-align:center;margin-bottom:20px">
              <div style="font-size:48px;margin-bottom:8px">👋</div>
              <div style="font-size:15px;font-weight:700">Welcome to Trimly!</div>
              <div style="font-size:12px;color:var(--text3);margin-top:4px">Just one more thing before you start booking</div>
            </div>
            <div class="fg">
              <label class="fl">Your Name</label>
              <input class="fi" [(ngModel)]="fullName" placeholder="Arjun Mehta" (keyup.enter)="saveName()">
            </div>
            <button class="btn btn-amber btn-block btn-lg" [disabled]="!fullName.trim()" (click)="saveName()">
              Let's Go! 🚀
            </button>
          }

          <!-- ── BARBER/ADMIN: Email + password login ── -->
          @if (step() === 'login') {
            <div class="fg">
              <label class="fl">Email</label>
              <input class="fi" [(ngModel)]="email" type="email" placeholder="you@example.com">
            </div>
            <div class="fg">
              <label class="fl">Password</label>
              <input class="fi" [(ngModel)]="password" type="password" placeholder="••••••••" (keyup.enter)="loginEmail()">
            </div>
            <button class="btn btn-amber btn-block btn-lg" [disabled]="loading() || !email || !password" (click)="loginEmail()">
              {{ loading() ? 'Logging in...' : 'Login →' }}
            </button>
            @if (activeTab() === 'barber') {
              <div style="display:flex;gap:8px;margin-top:12px">
                <button class="btn btn-ghost-amber btn-block btn-sm" (click)="step.set('register')">
                  📝 Register New Shop
                </button>
                <button class="btn btn-ghost btn-sm" (click)="step.set('forgot')">
                  Forgot password?
                </button>
              </div>
            }
            <div class="dt" style="margin-top:12px"><span>Customer? Use WhatsApp OTP</span></div>
            <button class="btn btn-ghost btn-block" (click)="step.set('phone'); activeTab.set('customer')">
              ← Back to phone login
            </button>
          }

          <!-- ── BARBER: Register ── -->
          @if (step() === 'register') {
            <div style="max-height:360px;overflow-y:auto;padding-right:4px">
              <div style="font-size:11px;font-weight:700;color:var(--amber);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Owner Details</div>
              <div class="fr">
                <div class="fg">
                  <label class="fl">Full Name</label>
                  <input class="fi" [(ngModel)]="reg.fullName" placeholder="Rajan Sharma">
                </div>
                <div class="fg">
                  <label class="fl">Phone</label>
                  <input class="fi" [(ngModel)]="reg.phone" type="tel" maxlength="10" placeholder="9876543210">
                </div>
              </div>
              <div class="fg">
                <label class="fl">Email</label>
                <input class="fi" [(ngModel)]="reg.email" type="email" placeholder="you@example.com">
              </div>
              <div class="fg">
                <label class="fl">Password</label>
                <input class="fi" [(ngModel)]="reg.password" type="password" placeholder="Min 6 chars">
              </div>
              <div style="font-size:11px;font-weight:700;color:var(--amber);text-transform:uppercase;letter-spacing:1px;margin:16px 0 12px">Shop Details</div>
              <div class="fg">
                <label class="fl">Shop Name</label>
                <input class="fi" [(ngModel)]="reg.shopName" placeholder="Blade & Co.">
              </div>
              <div class="fg">
                <label class="fl">Location</label>
                <input class="fi" [(ngModel)]="reg.location" placeholder="Koramangala, Bangalore">
              </div>
              <div class="fr">
                <div class="fg">
                  <label class="fl">City</label>
                  <input class="fi" [(ngModel)]="reg.city" placeholder="Bangalore">
                </div>
                <div class="fg">
                  <label class="fl">Area</label>
                  <input class="fi" [(ngModel)]="reg.area" placeholder="Koramangala">
                </div>
              </div>
            </div>
            <button class="btn btn-amber btn-block btn-lg" style="margin-top:12px"
              [disabled]="loading() || !regValid()" (click)="registerBarber()">
              {{ loading() ? 'Creating shop...' : 'Register Shop 🚀' }}
            </button>
            <div style="text-align:center;margin-top:8px">
              <button class="btn btn-ghost btn-sm" (click)="step.set('login')">← Already registered?</button>
            </div>
            <div style="font-size:11px;color:var(--text3);text-align:center;margin-top:8px">
              Your shop will be reviewed and activated within 24 hours
            </div>
          }

          <!-- ── Forgot Password ── -->
          @if (step() === 'forgot') {
            <div class="fg">
              <label class="fl">Registered Email</label>
              <input class="fi" [(ngModel)]="email" type="email" placeholder="you@example.com">
            </div>
            <button class="btn btn-amber btn-block" [disabled]="loading() || !email" (click)="forgotPassword()">
              {{ loading() ? 'Sending...' : 'Send Reset Link 💬' }}
            </button>
            <div style="text-align:center;margin-top:12px">
              <button class="btn btn-ghost btn-sm" (click)="step.set('login')">← Back to login</button>
            </div>
          }

          @if (errMsg()) {
            <div style="margin-top:12px;padding:10px 14px;background:var(--crimson-dim);border:1px solid rgba(255,59,107,0.2);border-radius:8px;font-size:12px;color:var(--crimson)">
              ❌ {{ errMsg() }}
            </div>
          }

        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:500;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(16px);animation:fadeIn 0.2s; }
    .auth-box { background:var(--surface);border:1px solid var(--border2);border-radius:24px;width:100%;max-width:420px;overflow:hidden;box-shadow:var(--shadow-lg);animation:fadeUp 0.3s cubic-bezier(0.22,1,0.36,1); }
    .auth-box-head { padding:28px 28px 0;background:linear-gradient(180deg,var(--card) 0%,transparent 100%); }
    .auth-box-logo { font-family:'Unbounded',sans-serif;font-size:22px;font-weight:900;color:var(--amber);margin-bottom:16px; }
    .auth-box-title { font-family:'Unbounded',sans-serif;font-size:22px;font-weight:900;line-height:1.2;margin-bottom:6px; }
    .auth-box-sub { font-size:13px;color:var(--text2);margin-bottom:24px; }
    .auth-box-body { padding:0 28px 28px; }
    .role-tabs { display:flex;gap:6px;margin-bottom:24px;background:var(--card);border-radius:12px;padding:4px; }
    .role-tab { flex:1;padding:9px 8px;border-radius:9px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:700;color:var(--text3);background:transparent;transition:all .15s;display:flex;flex-direction:column;align-items:center;gap:3px; }
    .rt-icon { font-size:18px; }
    .role-tab.active { background:var(--amber);color:#000; }
    .fr { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
  `]
})
export class AuthModalComponent {
  @Input() role: Tab = 'customer';
  @Output() close = new EventEmitter<void>();

  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  step = signal<Step>('phone');
  activeTab = signal<Tab>('customer');
  loading = signal(false);
  errMsg = signal('');
  resendCooldown = signal(0);

  phone = '';
  otp = '';
  email = '';
  password = '';
  fullName = '';

  reg = { fullName: '', email: '', password: '', phone: '', shopName: '', location: '', city: '', area: '' };

  tabs = [
    { key: 'customer' as Tab, icon: '👤', label: 'Customer' },
    { key: 'barber'   as Tab, icon: '✂️', label: 'Barber' },
    { key: 'admin'    as Tab, icon: '👑', label: 'Admin' },
  ];

  titles: Record<Step, string> = {
    phone: 'Welcome Back', otp: 'Enter OTP', name: 'Almost There!',
    login: 'Sign In', register: 'Register Shop', forgot: 'Reset Password'
  };

  subs: Record<Step, string> = {
    phone: 'Enter your mobile number to continue',
    otp: 'Enter the 6-digit code sent via WhatsApp',
    name: 'What should we call you?',
    login: 'Login to your barber / admin account',
    register: 'Set up your barbershop on Trimly',
    forgot: "We'll send a reset link to your WhatsApp"
  };

  ngOnInit() {
    if (this.role === 'barber') { this.step.set('login'); this.activeTab.set('barber'); }
    else if (this.role === 'admin') { this.step.set('login'); this.activeTab.set('admin'); }
    else { this.step.set('phone'); this.activeTab.set('customer'); }
  }

  switchTab(tab: Tab): void {
    this.activeTab.set(tab);
    this.errMsg.set('');
    if (tab === 'customer') this.step.set('phone');
    else this.step.set('login');
  }

  sendOtp(): void {
    if (this.phone.length !== 10) return;
    this.loading.set(true); this.errMsg.set('');
    this.auth.sendOtp(this.phone).subscribe({
      next: () => { this.step.set('otp'); this.loading.set(false); this.startResendCooldown(); },
      error: (e) => { this.errMsg.set(e.error?.message || 'Failed to send OTP'); this.loading.set(false); }
    });
  }

  resendOtp(): void { this.sendOtp(); }

  verifyOtp(): void {
    if (this.otp.length !== 6) return;
    this.loading.set(true); this.errMsg.set('');
    this.auth.verifyOtp(this.phone, this.otp).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.data?.isNewUser) {
          this.step.set('name');
        } else {
          this.toast.wa('Welcome back! 👋', '');
          this.router.navigate(['/customer']).then(() => this.close.emit());
        }
      },
      error: (e) => { this.errMsg.set(e.error?.message || 'Invalid OTP'); this.loading.set(false); }
    });
  }

  saveName(): void {
    if (!this.fullName.trim()) return;
    this.loading.set(true);
    this.auth.updateProfile(this.fullName.trim()).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.wa('Welcome to Trimly! 🎉', 'Your account is ready');
        this.close.emit();
        setTimeout(() => this.router.navigate(['/customer']), 50);
      },
      error: () => {
        this.loading.set(false);
        this.auth.updateUser({ ...this.auth.user()!, fullName: this.fullName.trim() });
        this.close.emit();
        setTimeout(() => this.router.navigate(['/customer']), 50);
      }
    });
  }

  loginEmail(): void {
    if (!this.email || !this.password) return;
    this.loading.set(true); this.errMsg.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toast.ok('Welcome back!', '');
        const role = res.data?.user?.role;
        const path = role === 'ADMIN' ? '/admin' : role === 'BARBER' ? '/barber' : '/customer';
        this.router.navigate([path]).then(() => this.close.emit());
      },
      error: (e) => { this.errMsg.set(e.error?.message || 'Invalid credentials'); this.loading.set(false); }
    });
  }

  registerBarber(): void {
    if (!this.regValid()) return;
    this.loading.set(true); this.errMsg.set('');
    this.auth.registerBarber(this.reg).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.ok('Shop registered!', 'Awaiting admin approval. You can login now.');
        this.step.set('login');
      },
      error: (e) => { this.errMsg.set(e.error?.message || 'Registration failed'); this.loading.set(false); }
    });
  }

  forgotPassword(): void {
    if (!this.email) return;
    this.loading.set(true); this.errMsg.set('');
    this.auth.forgotPassword(this.email).subscribe({
      next: () => { this.loading.set(false); this.toast.wa('Reset link sent to your WhatsApp!', ''); this.step.set('login'); },
      error: (e) => { this.errMsg.set(e.error?.message || 'Email not found'); this.loading.set(false); }
    });
  }

  regValid(): boolean {
    return !!(this.reg.fullName && this.reg.email && this.reg.password?.length >= 6 &&
      this.reg.phone?.length === 10 && this.reg.shopName && this.reg.location && this.reg.city && this.reg.area);
  }

  private startResendCooldown(): void {
    this.resendCooldown.set(60);
    const t = setInterval(() => {
      this.resendCooldown.update(v => v - 1);
      if (this.resendCooldown() <= 0) clearInterval(t);
    }, 1000);
  }
}
