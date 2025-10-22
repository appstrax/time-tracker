import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, Renderer2, ViewChild } from '@angular/core';

@Component({
  selector: 'app-split-pane-vertical',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './split-pane-vertical.component.html',
  styleUrls: ['./split-pane-vertical.component.scss'],
})
export class SplitPaneVerticalComponent implements OnInit {
  @Input() initialTopRatio = 0.7;
  @Input() storageKey: string | null = null;

  @Output() ratioChange = new EventEmitter<number>();

  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('divider', { static: true }) dividerRef!: ElementRef<HTMLDivElement>;

  isDragging = false;
  topRatio = this.initialTopRatio;
  collapsedSide: 'top' | 'bottom' | null = null;
  lastNonCollapsedRatio = this.initialTopRatio;
  private readonly collapseSnapPx = 8;

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    this.loadPersisted();
    if (this.topRatio > 0 && this.topRatio < 1) this.lastNonCollapsedRatio = this.topRatio;
  }

  private loadPersisted() {
    if (!this.storageKey) return;
    try {
      const s = localStorage.getItem(this.storageKey);
      if (s) {
        const parsed = JSON.parse(s);
        if (typeof parsed.topRatio === 'number') this.topRatio = parsed.topRatio;
        if (parsed.collapsedSide === 'top' || parsed.collapsedSide === 'bottom' || parsed.collapsedSide === null) this.collapsedSide = parsed.collapsedSide;
        if (typeof parsed.lastNonCollapsedRatio === 'number') this.lastNonCollapsedRatio = parsed.lastNonCollapsedRatio;
      }
    } catch {}
  }

  private persist() {
    if (!this.storageKey) return;
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify({ topRatio: this.topRatio, collapsedSide: this.collapsedSide, lastNonCollapsedRatio: this.lastNonCollapsedRatio })
      );
    } catch {}
  }

  onDividerMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.isDragging = true;
    this.renderer.addClass(document.body, 'noselect');
  }

  @HostListener('document:mouseup') onMouseUp() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.renderer.removeClass(document.body, 'noselect');
    this.persist();
  }

  @HostListener('document:mousemove', ['$event']) onMouseMove(e: MouseEvent) {
    if (!this.isDragging) return;
    const container = this.containerRef.nativeElement;
    const rect = container.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const clamped = Math.max(0, Math.min(y, rect.height));

    if (clamped <= this.collapseSnapPx) {
      this.topRatio = 0;
      this.collapsedSide = 'top';
    } else if (clamped >= rect.height - this.collapseSnapPx) {
      this.topRatio = 1;
      this.collapsedSide = 'bottom';
    } else {
      this.topRatio = clamped / rect.height;
      this.collapsedSide = null;
      this.lastNonCollapsedRatio = this.topRatio;
    }
    this.ratioChange.emit(this.topRatio);
  }

  get showCollapsedTop(): boolean {
    return this.collapsedSide === 'top';
  }
  get showCollapsedBottom(): boolean {
    return this.collapsedSide === 'bottom';
  }

  restoreFromTop() {
    this.collapsedSide = null;
    this.topRatio = this.initialTopRatio;
    this.lastNonCollapsedRatio = this.initialTopRatio;
    this.ratioChange.emit(this.topRatio);
    this.persist();
  }

  restoreFromBottom() {
    this.collapsedSide = null;
    this.topRatio = this.initialTopRatio;
    this.lastNonCollapsedRatio = this.initialTopRatio;
    this.ratioChange.emit(this.topRatio);
    this.persist();
  }
}


