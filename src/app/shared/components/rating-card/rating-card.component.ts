import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rating-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (!submitted()) {
      <div class="anim-fade-up" style="margin-top:12px;background:linear-gradient(135deg,rgba(245,166,35,0.07),rgba(245,166,35,0.03));border:1px solid rgba(245,166,35,0.2);border-radius:12px;padding:14px 16px">
        <div style="font-weight:700;font-size:13px;margin-bottom:2px">⭐ Rate {{ barberName }}</div>
        <div style="font-size:11px;color:var(--text3);margin-bottom:10px">How was your experience? Your review helps others.</div>

        <!-- Star picker -->
        <div style="display:flex;gap:6px;margin-bottom:8px;align-items:center">
          @for (s of [1,2,3,4,5]; track s) {
            <button (click)="selected.set(s)"
              (mouseenter)="hovered.set(s)" (mouseleave)="hovered.set(0)"
              style="background:none;border:none;cursor:pointer;font-size:28px;transition:all .15s;padding:0"
              [style.color]="s <= (hovered() || selected()) ? 'var(--amber)' : 'var(--border2)'"
              [style.transform]="s <= (hovered() || selected()) ? 'scale(1.15)' : 'scale(1)'">★</button>
          }
          @if ((hovered() || selected()) > 0) {
            <span style="font-size:12px;color:var(--amber);font-weight:600;margin-left:4px">
              {{ labels[hovered() || selected()] }}
            </span>
          }
        </div>

        <!-- Written review (appears after star pick) -->
        @if (selected() > 0) {
          <div class="anim-fade-up">
            <textarea class="fi" [(ngModel)]="review" [placeholder]="'Tell us about ' + barberName + '... (optional)'"
              rows="2" maxlength="300" style="resize:none;margin-bottom:8px;font-size:13px"></textarea>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:10px;color:var(--text3)">{{ review.length }}/300</span>
              <button class="btn btn-amber btn-sm" (click)="submit()">Submit Review</button>
            </div>
          </div>
        }
      </div>
    }
  `
})
export class RatingCardComponent {
  @Input() bookingId!: number;
  @Input() barberName = '';
  @Output() rated = new EventEmitter<{ rating: number; review: string }>();

  hovered = signal(0);
  selected = signal(0);
  review = '';
  submitted = signal(false);

  labels = ['', 'Terrible 😞', 'Poor 😕', 'Okay 😐', 'Good 😊', 'Excellent 🤩'];

  submit(): void {
    if (!this.selected()) return;
    this.rated.emit({ rating: this.selected(), review: this.review.trim() });
    this.submitted.set(true);
  }
}
