import { Component, inject, OnInit, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastService } from './core/services/toast.service';
import { NotificationService } from './core/services/notification.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <router-outlet></router-outlet>

    <!-- Toast Rack -->
    <div class="toast-rack">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast t-{{t.type}}" (click)="toast.remove(t.id)">
          <span class="toast-ico">{{ toastIcon(t.type) }}</span>
          <div>
            <div class="toast-title">{{ t.title }}</div>
            <div class="toast-msg">{{ t.msg }}</div>
          </div>
        </div>
      }
    </div>
  `
})
export class AppComponent implements OnInit {
  toast = inject(ToastService);
  private auth = inject(AuthService);
  private notifSvc = inject(NotificationService);
  private pollInterval?: ReturnType<typeof setInterval>;

  constructor() {
    effect(() => {
      const session = this.auth.session();
      if (session) {
        this.startPolling();
      } else {
        this.stopPolling();
      }
    });
  }

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.startPolling();
    }
  }

  private startPolling(): void {
    this.notifSvc.refreshCount();
    this.pollInterval = setInterval(() => this.notifSvc.refreshCount(), 20000);
  }

  private stopPolling(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  toastIcon(type: string): string {
    return type === 'ok' ? '✅' : type === 'warn' ? '⚠️' : '❌';
  }
}
