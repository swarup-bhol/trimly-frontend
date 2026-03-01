import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  title: string;
  msg: string;
  type: 'ok' | 'err' | 'warn' | 'wa';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(title: string, msg: string, type: Toast['type'] = 'ok', duration = 4000): void {
    const id = Math.random().toString(36).slice(2);
    this.toasts.update(t => [...t, { id, title, msg, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  ok(title: string, msg = '')   { this.show(title, msg, 'ok'); }
  err(title: string, msg = '')  { this.show(title, msg, 'err'); }
  warn(title: string, msg = '') { this.show(title, msg, 'warn'); }
  wa(title: string, msg = '')   { this.show(title, msg, 'wa'); }

  dismiss(id: string): void {
    this.toasts.update(t => t.filter(x => x.id !== id));
  }
}
