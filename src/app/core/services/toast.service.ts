import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  title: string;
  msg: string;
  type: 'ok' | 'warn' | 'err';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private counter = 0;

  show(title: string, msg: string, type: 'ok' | 'warn' | 'err' = 'ok'): void {
    const id = ++this.counter;
    this._toasts.update(t => [...t, { id, title, msg, type }]);
    setTimeout(() => this._toasts.update(t => t.filter(x => x.id !== id)), 4500);
  }

  remove(id: number): void {
    this._toasts.update(t => t.filter(x => x.id !== id));
  }
}
