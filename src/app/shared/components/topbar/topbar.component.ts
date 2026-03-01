import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="topbar">
      <div class="topbar-brand">TRIM<span style="color:var(--text3);font-weight:400">LY</span></div>
      <div style="display:flex;align-items:center;gap:10px">
        @if (notifCount > 0) {
          <button class="notif-btn" (click)="notifClick.emit()">
            🔔 <span class="notif-dot"></span>
          </button>
        }
        <div class="user-pill" (click)="menuOpen = !menuOpen" style="position:relative">
          <div class="up-av">{{ initials }}</div>
          <div>
            <div class="up-name">{{ auth.user()?.fullName || 'User' }}</div>
            <div class="up-role">{{ auth.user()?.role }}</div>
          </div>
          @if (menuOpen) {
            <div style="position:absolute;top:48px;right:0;background:var(--card);border:1px solid var(--border2);border-radius:12px;padding:8px;min-width:160px;z-index:200;box-shadow:var(--shadow-md)">
              @if (showSettings) {
                <button class="sb-item" (click)="settingsClick.emit(); menuOpen=false">⚙️ Settings</button>
              }
              <button class="sb-item" style="color:var(--crimson)" (click)="auth.logout(); menuOpen=false">
                🚪 Logout
              </button>
              <button class="sb-item" style="color:var(--text3);font-size:11px" (click)="auth.logout(true); menuOpen=false">
                Logout all devices
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class TopbarComponent {
  @Input() notifCount = 0;
  @Input() showSettings = false;
  @Output() notifClick = new EventEmitter<void>();
  @Output() settingsClick = new EventEmitter<void>();

  auth = inject(AuthService);
  menuOpen = false;

  get initials(): string {
    const name = this.auth.user()?.fullName || 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
  }
}
