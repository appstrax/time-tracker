import { FormsModule } from '@angular/forms';
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  standalone: true,
  templateUrl: './confirm.modal.html',
  styleUrl: './confirm.modal.scss',
  imports: [FormsModule],
})
export class ConfirmModalComponent {
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() confirmButtonText: string = 'Confirm';
  @Input() cancelButtonText: string = 'Cancel';
  @Input() onConfirm: () => void = () => {};

  @Input() confirmButtonClass: string = 'btn-primary';
  @Input() headerClass: string = 'bg-primary text-white';

  constructor(public activeModal: NgbActiveModal) {}

  onConfirmClick(): void {
    this.onConfirm();
    this.activeModal.close();
  }

  close(): void {
    this.activeModal.dismiss();
  }
}

export interface ConfirmModalOptions {
  title: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm: () => void;
}
