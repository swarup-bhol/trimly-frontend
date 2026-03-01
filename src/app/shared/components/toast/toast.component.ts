import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-rack">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast t-{{t.type}}">
          <div class="toast-ico">
            {{ t.type === 'ok' ? '✅' : t.type === 'err' ? '❌' : t.type === 'wa' ? '💬' : '⚠️' }}
          </div>
          <div>
            <div class="toast-title">{{ t.title }}</div>
            @if (t.msg) { <div class="toast-msg">{{ t.msg }}</div> }
          </div>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  toast = inject(ToastService);
}
