import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-policy-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="min-height:100vh;background:var(--bg);display:flex;flex-direction:column">
      <nav style="display:flex;align-items:center;gap:16px;padding:16px 24px;border-bottom:1px solid var(--border);background:var(--surface);position:sticky;top:0;z-index:100">
        <button class="btn btn-ghost btn-sm" (click)="back.emit()">← Back</button>
        <div style="font-family:'Unbounded',sans-serif;font-size:14px;font-weight:700">
          {{ policy()?.title || '...' }}
        </div>
      </nav>

      @if (policy()) {
        <div style="max-width:720px;margin:0 auto;padding:40px 24px;animation:fadeUp .4s ease">
          <div style="text-align:center;margin-bottom:40px">
            <div style="font-size:52px;margin-bottom:16px">
              {{ type === 'terms' ? '📋' : type === 'privacy' ? '🔒' : '💰' }}
            </div>
            <h1 style="font-family:'Unbounded',sans-serif;font-size:clamp(24px,4vw,36px);font-weight:900;margin-bottom:8px">
              {{ policy()!.title }}
            </h1>
            <p style="color:var(--text3);font-size:13px">Last updated: {{ policy()!.lastUpdated }}</p>
            @if (policy()!.company) {
              <p style="color:var(--text3);font-size:12px;margin-top:4px">{{ policy()!.company }}</p>
            }
          </div>

          @for (sec of policy()!.sections; track sec.heading) {
            <div style="margin-bottom:28px">
              <h3 style="font-family:'Unbounded',sans-serif;font-size:14px;font-weight:700;color:var(--amber);margin-bottom:8px">
                {{ sec.heading }}
              </h3>
              <p style="font-size:14px;color:var(--text2);line-height:1.8;white-space:pre-line">{{ sec.body }}</p>
            </div>
          }

          <div style="margin-top:40px;padding:20px;background:var(--card);border-radius:12px;text-align:center">
            <div style="font-size:13px;color:var(--text2)">Questions? Contact us</div>
            <div style="display:flex;gap:16px;justify-content:center;margin-top:8px;flex-wrap:wrap">
              <a href="mailto:support@trimly.app" style="color:var(--amber);font-size:13px">support&#64;trimly.app</a>
              <a href="mailto:legal@trimly.app"   style="color:var(--amber);font-size:13px">legal&#64;trimly.app</a>
            </div>
          </div>
        </div>
      } @else {
        <div class="empty"><div class="ei">📄</div><div class="et">Loading...</div></div>
      }
    </div>
  `
})
export class PolicyPageComponent implements OnInit {
  @Input() type!: string;
  @Output() back = new EventEmitter<void>();

  private http = inject(HttpClient);
  policy = signal<any>(null);

  ngOnInit() {
    this.http.get<any>(`${environment.apiUrl}/legal/${this.type}`).subscribe({
      next: res => this.policy.set(res.data),
      error: () => this.policy.set({ title: 'Policy', lastUpdated: 'N/A', sections: [{ heading: 'Unavailable', body: 'Please try again later.' }] })
    });
  }
}
