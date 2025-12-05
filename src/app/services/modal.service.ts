import { TemplateRef, Injectable, Type } from '@angular/core';
import {
  NgbModal,
  NgbModalRef,
  NgbModalOptions,
} from '@ng-bootstrap/ng-bootstrap';
import { TimeSheetEntryComponent, TimeSheetEntryModalOptions } from '../pages/time-sheets/modals/time-sheet-entry/time-sheet-entry.modal';
import { UnapprovedEntriesModalComponent, UnapprovedEntriesModalOptions } from '../pages/time-sheets/modals/unapproved-entries/unapproved-entries.modal';

import { ChatContextModalComponent } from '../components/chat-context-modal/chat-context-modal.component';
import { PromptAnalyserModalComponent } from '../components/prompt-analyser/prompt-analyser-modal.component';


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
    const modalRef = this.modalService.open(TimeSheetEntryComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: true
    });
    Object.assign(modalRef.componentInstance, options);
    return modalRef;
  }

  public showUnapprovedEntriesModal(options: UnapprovedEntriesModalOptions): NgbModalRef {
    const modalRef = this.modalService.open(UnapprovedEntriesModalComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: true,
      size: 'lg'
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

  public showPromptAnalyserModal(promptText: string, options?: NgbModalOptions): NgbModalRef {
    const modalRef = this.modalService.open(PromptAnalyserModalComponent, {
      centered: true,
      backdrop: true,
      keyboard: true,
      ...options
    });
    (modalRef.componentInstance as PromptAnalyserModalComponent).promptText = promptText;
    return modalRef;
  }

}


