import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="badge {{cls}}">{{ label }}</span>`
})
export class BadgeComponent {
  @Input() status = '';

  get cls(): string {
    const map: Record<string, string> = {
      ACTIVE: 'bg',     active: 'bg',
      PENDING: 'by',    pending: 'by',
      CONFIRMED: 'bb',  confirmed: 'bb',
      COMPLETED: 'bm',  completed: 'bm',
      REJECTED: 'br',   rejected: 'br',
      CANCELLED: 'br',  cancelled: 'br',
      DISABLED: 'br',   disabled: 'br',
      RESCHEDULE_REQUESTED: 'by',
    };
    return map[this.status] || 'bm';
  }

  get label(): string {
    const map: Record<string, string> = {
      ACTIVE: '● Active',       active: '● Active',
      PENDING: '⏳ Pending',    pending: '⏳ Pending',
      CONFIRMED: '✓ Confirmed', confirmed: '✓ Confirmed',
      COMPLETED: '🏁 Done',     completed: '🏁 Done',
      REJECTED: '✕ Rejected',   rejected: '✕ Rejected',
      CANCELLED: '🚫 Cancelled',cancelled: '🚫 Cancelled',
      DISABLED: '⛔ Disabled',  disabled: '⛔ Disabled',
      RESCHEDULE_REQUESTED: '🔄 Reschedule',
    };
    return map[this.status] || this.status;
  }
}
