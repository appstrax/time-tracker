import { TemplateRef, Injectable, Type } from '@angular/core';
import { Model } from '@appstrax/services/shared/models/model';
import {
  NgbModal,
  NgbModalRef,
  NgbModalOptions,
} from '@ng-bootstrap/ng-bootstrap';
import { TimeSheetEntryCrudComponent, TimeSheetEntryModalOptions } from '../pages/time-sheets/modals/time-sheet-entry/time-sheet-entry.modal';
import { ChatContextModalComponent } from '../components/chat-context-modal/chat-context-modal.component';


@Injectable({ providedIn: 'root' })
export class ModalService {
  private modalRef?: NgbModalRef;

  constructor(private modalService: NgbModal) {
  }

  public open(modal: TemplateRef<any>, options?: NgbModalOptions): NgbModalRef {
    this.modalRef = this.modalService.open(modal, options);
    return this.modalRef;
  }

  public close(): void {
    if (!this.modalRef) return;
    this.modalRef.close();
  }

  public dismiss(): void {
    if (!this.modalRef) return;
    this.modalRef.dismiss();
  }

  public showTimeSheetEntryModal(options: TimeSheetEntryModalOptions): NgbModalRef {
    const modalRef = this.modalService.open(TimeSheetEntryCrudComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: true
    });
    Object.assign(modalRef.componentInstance, options);
    return modalRef;
  }

  public showChatContextModal(initialContext: any, options?: NgbModalOptions): NgbModalRef {
    const modalRef = this.modalService.open(ChatContextModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: true,
      size: 'xl',
      ...options
    });
    (modalRef.componentInstance as ChatContextModalComponent).context = initialContext;
    return modalRef;
  }

}

export abstract class ModalCrudOptions<T extends Model> {
  onSave(model: T): Promise<void> {
    return Promise.resolve();
  }
}
