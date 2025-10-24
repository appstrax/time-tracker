import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastItem } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.scss'],
})
export class ToastContainerComponent {
  toasts: ToastItem[] = [];

  constructor(private toast: ToastService) {
    effect(() => {
      this.toasts = this.toast.toasts();
    });
  }

  dismiss(id: number) {
    this.toast.dismiss(id);
  }

  beginDismiss(id: number) {
    this.toast.beginDismiss(id);
  }
}


