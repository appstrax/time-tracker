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
  @Input() minLeftPx = 480;
  @Input() minRightPx = 320;
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

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    this.loadPersisted();
    this.applyResponsiveCollapse();
  }

  private loadPersisted() {
    if (!this.storageKey) return;
    try {
      const s = localStorage.getItem(this.storageKey);
      if (s) {
        const parsed = JSON.parse(s);
        if (typeof parsed.leftRatio === 'number') this.leftRatio = parsed.leftRatio;
        if (typeof parsed.isCollapsed === 'boolean') this.isCollapsed = parsed.isCollapsed;
      }
    } catch {}
  }

  private persist() {
    if (!this.storageKey) return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({ leftRatio: this.leftRatio, isCollapsed: this.isCollapsed }));
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
    const left = Math.max(this.minLeftPx, Math.min(x, rect.width - this.minRightPx));
    this.leftRatio = left / rect.width;
    this.ratioChange.emit(this.leftRatio);
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.collapsedChange.emit(this.isCollapsed);
    this.persist();
  }
}


