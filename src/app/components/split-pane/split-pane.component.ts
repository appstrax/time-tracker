import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, Renderer2, ViewChild } from '@angular/core';

@Component({
  selector: 'app-split-pane',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './split-pane.component.html',
  styleUrls: ['./split-pane.component.scss'],
})
export class SplitPaneComponent implements OnInit {
  @Input() initialLeftRatio = 0.7;
  // Ensures a comfortable starting size when restoring from a fully collapsed state
  @Input() restoreMinRatio = 0.3;
  @Input() collapseBreakpointPx = 1024;
  @Input() collapsedOnSmallScreens = true;
  @Input() storageKey: string | null = null; 

  @Input() set collapsed(value: boolean | null) {
    if (value === null || value === undefined) return;
    this.isCollapsed = value;
  }
  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() ratioChange = new EventEmitter<number>();

  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('divider', { static: true }) dividerRef!: ElementRef<HTMLDivElement>;

  isDragging = false;
  isCollapsed = false;
  leftRatio = this.initialLeftRatio;
  // Tracks which side is fully collapsed due to dragging (not responsive collapse)
  collapsedSide: 'left' | 'right' | null = null;
  // Last non-collapsed ratio for restoring after a collapse
  lastNonCollapsedRatio = this.initialLeftRatio;

  // Pixel snap threshold near edges to consider as fully collapsed when dragging
  private readonly collapseSnapPx = 8;

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    this.loadPersisted();
    this.applyResponsiveCollapse();
    // Ensure lastNonCollapsedRatio has a sane initial value
    if (this.leftRatio > 0 && this.leftRatio < 1) {
      this.lastNonCollapsedRatio = this.leftRatio;
    }
  }

  private loadPersisted() {
    if (!this.storageKey) return;
    try {
      const s = localStorage.getItem(this.storageKey);
      if (s) {
        const parsed = JSON.parse(s);
        if (typeof parsed.leftRatio === 'number') this.leftRatio = parsed.leftRatio;
        if (typeof parsed.isCollapsed === 'boolean') this.isCollapsed = parsed.isCollapsed;
        if (parsed.collapsedSide === 'left' || parsed.collapsedSide === 'right' || parsed.collapsedSide === null) {
          this.collapsedSide = parsed.collapsedSide;
        }
        if (typeof parsed.lastNonCollapsedRatio === 'number') {
          this.lastNonCollapsedRatio = parsed.lastNonCollapsedRatio;
        }
      }
    } catch {}
  }

  private persist() {
    if (!this.storageKey) return;
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify({
          leftRatio: this.leftRatio,
          isCollapsed: this.isCollapsed,
          collapsedSide: this.collapsedSide,
          lastNonCollapsedRatio: this.lastNonCollapsedRatio,
        })
      );
    } catch {}
  }

  @HostListener('window:resize') onResize() {
    this.applyResponsiveCollapse();
  }

  private applyResponsiveCollapse() {
    const width = window.innerWidth;
    if (width < this.collapseBreakpointPx && this.collapsedOnSmallScreens) {
      if (!this.isCollapsed) {
        this.isCollapsed = true;
        this.collapsedChange.emit(true);
        this.persist();
      }
    }
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
    if (!this.isDragging || this.isCollapsed) return;
    const container = this.containerRef.nativeElement;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left; 
    const clamped = Math.max(0, Math.min(x, rect.width));

    // Snap to fully collapsed near edges
    if (clamped <= this.collapseSnapPx) {
      this.leftRatio = 0;
      this.collapsedSide = 'left';
    } else if (clamped >= rect.width - this.collapseSnapPx) {
      this.leftRatio = 1;
      this.collapsedSide = 'right';
    } else {
      this.leftRatio = clamped / rect.width;
      this.collapsedSide = null;
      this.lastNonCollapsedRatio = this.leftRatio;
    }
    this.ratioChange.emit(this.leftRatio);
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.collapsedChange.emit(this.isCollapsed);
    if (!this.isCollapsed) {
      // Restoring from responsive collapse
      this.collapsedSide = null;
      this.leftRatio = this.computeRestoreTarget();
      this.ratioChange.emit(this.leftRatio);
    }
    this.persist();
  }

  // Helpers to determine UI state
  get showCollapsedLeft(): boolean {
    return this.isCollapsed || this.collapsedSide === 'left';
  }

  get showCollapsedRight(): boolean {
    return this.collapsedSide === 'right';
  }

  restoreFromLeft() {
    this.isCollapsed = false;
    this.collapsedSide = null;
    this.leftRatio = this.computeRestoreTarget();
    this.ratioChange.emit(this.leftRatio);
    this.collapsedChange.emit(this.isCollapsed);
    this.persist();
  }

  restoreFromRight() {
    this.isCollapsed = false;
    this.collapsedSide = null;
    this.leftRatio = this.computeRestoreTarget();
    this.ratioChange.emit(this.leftRatio);
    this.collapsedChange.emit(this.isCollapsed);
    this.persist();
  }

  private computeRestoreTarget(): number {
    const base = this.lastNonCollapsedRatio > 0 && this.lastNonCollapsedRatio < 1
      ? this.lastNonCollapsedRatio
      : this.initialLeftRatio;
    const min = Math.max(0, Math.min(this.restoreMinRatio, 0.5));
    const max = 1 - min;
    return Math.max(min, Math.min(base, max));
  }
}


