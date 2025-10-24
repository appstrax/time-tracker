import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
  timeoutMs?: number;
  closing?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private toastsSig = signal<ToastItem[]>([]);

  toasts() {
    return this.toastsSig();
  }

  show(toast: Omit<ToastItem, 'id'>): number {
    const id = this.nextId++;
    const item: ToastItem = { id, timeoutMs: 4000, closing: false, ...toast };
    this.toastsSig.update((list) => [item, ...list]);
    if (item.timeoutMs && item.timeoutMs > 0) {
      setTimeout(() => this.beginDismiss(id), item.timeoutMs);
    }
    return id;
  }

  success(message: string, title?: string, timeoutMs = 4000) {
    return this.show({ type: 'success', message, title, timeoutMs });
  }

  error(message: string, title?: string, timeoutMs = 6000) {
    return this.show({ type: 'error', message, title, timeoutMs });
  }

  info(message: string, title?: string, timeoutMs = 4000) {
    return this.show({ type: 'info', message, title, timeoutMs });
  }

  warning(message: string, title?: string, timeoutMs = 5000) {
    return this.show({ type: 'warning', message, title, timeoutMs });
  }

  beginDismiss(id: number, exitMs: number = 300) {
    this.toastsSig.update((list) => {
      const idx = list.findIndex((t) => t.id === id);
      if (idx === -1) return list;
      const target = list[idx];
      if (target.closing) return list; // already closing
      const updated = [...list];
      updated[idx] = { ...target, closing: true };
      // remove after exit animation
      setTimeout(() => this.dismiss(id), exitMs);
      return updated;
    });
  }

  dismiss(id: number) {
    this.toastsSig.update((list) => list.filter((t) => t.id !== id));
  }

  clear() {
    this.toastsSig.set([]);
  }
}


