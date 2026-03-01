import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

type Step = 'form' | 'success' | 'invalid';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="min-height:100vh;background:var(--bg);display:flex;align-items:center;justify-content:center;padding:24px">

      <!-- Brand -->
      <div style="position:fixed;top:0;left:0;right:0;padding:20px 24px;display:flex;align-items:center">
        <div style="font-family:'Unbounded',sans-serif;font-size:20px;font-weight:900;color:#fff">
          TRIM<span style="color:var(--amber)">LY</span>
        </div>
      </div>

      <div style="width:100%;max-width:420px">

        <!-- Invalid token -->
        @if (step() === 'invalid') {
          <div class="card anim-fade-up" style="text-align:center;padding:40px 32px">
            <div style="font-size:56px;margin-bottom:16px">⚠️</div>
            <div style="font-family:'Unbounded',sans-serif;font-size:18px;font-weight:700;margin-bottom:8px">
              Invalid or Expired Link
            </div>
            <div style="color:var(--text2);font-size:13px;margin-bottom:24px;line-height:1.6">
              This password reset link is invalid or has already been used. Please request a new one.
            </div>
            <button class="btn btn-amber btn-block" (click)="goToLogin()">
              Back to Login
            </button>
          </div>
        }

        <!-- Reset form -->
        @if (step() === 'form') {
          <div class="card anim-fade-up" style="padding:36px 32px">
            <div style="text-align:center;margin-bottom:28px">
              <div style="font-size:48px;margin-bottom:12px">🔐</div>
              <div style="font-family:'Unbounded',sans-serif;font-size:20px;font-weight:700;margin-bottom:6px">
                Reset Password
              </div>
              <div style="color:var(--text2);font-size:13px">
                Enter your new password below
              </div>
            </div>

            <div class="fg">
              <label class="fl">New Password</label>
              <div style="position:relative">
                <input class="fi"
                  [type]="showPass() ? 'text' : 'password'"
                  [(ngModel)]="newPassword"
                  placeholder="Min 8 characters"
                  (keyup.enter)="submit()">
                <button (click)="showPass.set(!showPass())"
                  style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text3);font-size:16px">
                  {{ showPass() ? '🙈' : '👁️' }}
                </button>
              </div>

              <!-- Password strength -->
              @if (newPassword.length > 0) {
                <div style="margin-top:8px">
                  <div style="display:flex;gap:4px;margin-bottom:4px">
                    @for (i of [1,2,3,4]; track i) {
                      <div style="height:3px;flex:1;border-radius:2px;transition:background .2s"
                        [style.background]="i <= strength() ? strengthColor() : 'var(--border2)'">
                      </div>
                    }
                  </div>
                  <div style="font-size:11px" [style.color]="strengthColor()">
                    {{ strengthLabel() }}
                  </div>
                </div>
              }
            </div>

            <div class="fg" style="margin-top:14px">
              <label class="fl">Confirm Password</label>
              <input class="fi"
                [type]="showPass() ? 'text' : 'password'"
                [(ngModel)]="confirmPassword"
                placeholder="Repeat new password"
                (keyup.enter)="submit()">
              @if (confirmPassword && newPassword !== confirmPassword) {
                <div style="font-size:11px;color:var(--crimson);margin-top:4px">
                  ✕ Passwords don't match
                </div>
              }
            </div>

            @if (errMsg()) {
              <div style="background:var(--crimson-dim);border:1px solid rgba(239,68,68,.2);border-radius:10px;padding:10px 14px;font-size:12px;color:var(--crimson);margin-top:12px">
                {{ errMsg() }}
              </div>
            }

            <button class="btn btn-amber btn-block btn-lg" style="margin-top:20px"
              [disabled]="loading() || !canSubmit()"
              (click)="submit()">
              @if (loading()) { <span>Resetting...</span> }
              @else { <span>Reset Password 🔐</span> }
            </button>
          </div>
        }

        <!-- Success -->
        @if (step() === 'success') {
          <div class="card anim-fade-up" style="text-align:center;padding:40px 32px">
            <div style="font-size:56px;margin-bottom:16px">✅</div>
            <div style="font-family:'Unbounded',sans-serif;font-size:18px;font-weight:700;margin-bottom:8px">
              Password Reset!
            </div>
            <div style="color:var(--text2);font-size:13px;margin-bottom:24px;line-height:1.6">
              Your password has been updated successfully. You can now login with your new password.
            </div>
            <button class="btn btn-amber btn-block" (click)="goToLogin()">
              Go to Login →
            </button>
          </div>
        }

      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private auth   = inject(AuthService);
  private toast  = inject(ToastService);

  step            = signal<Step>('form');
  loading         = signal(false);
  showPass        = signal(false);
  errMsg          = signal('');

  token           = '';
  newPassword     = '';
  confirmPassword = '';

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) this.step.set('invalid');
  }

  canSubmit(): boolean {
    return this.newPassword.length >= 8 &&
           this.newPassword === this.confirmPassword;
  }

  strength(): number {
    const p = this.newPassword;
    let s = 0;
    if (p.length >= 8)                      s++;
    if (/[A-Z]/.test(p))                    s++;
    if (/[0-9]/.test(p))                    s++;
    if (/[^A-Za-z0-9]/.test(p))            s++;
    return s;
  }

  strengthColor(): string {
    return ['', 'var(--crimson)', 'var(--amber)', '#f59e0b', 'var(--emerald)'][this.strength()];
  }

  strengthLabel(): string {
    return ['', 'Weak', 'Fair', 'Good', 'Strong'][this.strength()];
  }

  submit() {
    if (!this.canSubmit()) return;
    this.loading.set(true);
    this.errMsg.set('');
    this.auth.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.loading.set(false);
        this.step.set('success');
      },
      error: (e) => {
        this.loading.set(false);
        const msg = e.error?.message || 'Invalid or expired reset link';
        if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('expired')) {
          this.step.set('invalid');
        } else {
          this.errMsg.set(msg);
        }
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/']);
  }
}
