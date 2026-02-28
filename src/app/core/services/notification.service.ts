import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Notification } from '../models/models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  unreadCount = signal<number>(0);

  refreshCount(): void {
    if (!this.auth.isLoggedIn()) return;
    this.api.get<{count: number}>('/notifications/unread-count').subscribe({
      next: r => this.unreadCount.set(r.count),
      error: () => {}
    });
  }

  getAll() {
    return this.api.get<Notification[]>('/notifications');
  }

  markRead(id: number) {
    return this.api.patch(`/notifications/${id}/read`);
  }

  markAllRead() {
    return this.api.post('/notifications/mark-all-read', {});
  }
}
