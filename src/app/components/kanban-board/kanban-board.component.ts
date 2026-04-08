
import { Component, EventEmitter, Input, Output } from '@angular/core';

type KanbanCard = {
  id: string;
  title: string;
  description?: string;
};

type KanbanColumn = {
  id: string;
  title: string;
  cards: KanbanCard[];
};

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [],
  templateUrl: './kanban-board.component.html',
  styleUrls: ['./kanban-board.component.scss'],
})
export class KanbanBoardComponent {
  @Input() storageKey: string | null = 'kanban.board.v1';
  @Input() initialColumns: KanbanColumn[] | null = null;
  @Output() boardChange = new EventEmitter<KanbanColumn[]>();

  columns: KanbanColumn[] = [];

  // Editing state
  editingColumnId: string | null = null;
  editingCardId: string | null = null;

  ngOnInit() {
    this.load();
    if (!this.columns.length) {
      this.columns = this.initialColumns ?? [
        { id: this.generateId(), title: 'Backlog', cards: [] },
        { id: this.generateId(), title: 'In Progress', cards: [] },
        { id: this.generateId(), title: 'Review', cards: [] },
        { id: this.generateId(), title: 'Done', cards: [] },
      ];
      this.persist();
    }
  }

  // Basic persistence
  private load() {
    if (!this.storageKey) return;
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) this.columns = JSON.parse(raw);
    } catch {}
  }

  private persist() {
    if (!this.storageKey) return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.columns));
    } catch {}
    this.boardChange.emit(this.columns);
  }

  // Helpers
  generateId(): string {
    return Math.random().toString(36).slice(2, 10);
  }

  // Column actions
  addColumn() {
    this.columns.push({ id: this.generateId(), title: 'New Column', cards: [] });
    this.persist();
  }

  renameColumn(column: KanbanColumn, newTitle: string) {
    column.title = newTitle.trim() || column.title;
    this.editingColumnId = null;
    this.persist();
  }

  deleteColumn(column: KanbanColumn) {
    this.columns = this.columns.filter(c => c.id !== column.id);
    this.persist();
  }

  moveColumn(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    const [col] = this.columns.splice(fromIndex, 1);
    this.columns.splice(toIndex, 0, col);
    this.persist();
  }

  // Card actions
  addCard(column: KanbanColumn) {
    const title = 'New Card';
    column.cards.push({ id: this.generateId(), title });
    this.persist();
  }

  editCard(card: KanbanCard, newTitle: string, newDesc: string | undefined) {
    card.title = (newTitle || '').trim() || card.title;
    card.description = (newDesc || '').trim();
    this.editingCardId = null;
    this.persist();
  }

  deleteCard(column: KanbanColumn, cardId: string) {
    column.cards = column.cards.filter(c => c.id !== cardId);
    this.persist();
  }

  // Native DnD handlers
  onColumnDragStart(event: DragEvent, index: number) {
    event.dataTransfer?.setData('text/column-index', String(index));
    event.dataTransfer?.setDragImage(new Image(), 0, 0);
  }

  onColumnDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onColumnDrop(event: DragEvent, toIndex: number) {
    const fromIndexStr = event.dataTransfer?.getData('text/column-index');
    if (!fromIndexStr) return;
    const fromIndex = Number(fromIndexStr);
    this.moveColumn(fromIndex, toIndex);
  }

  onCardDragStart(event: DragEvent, columnId: string, cardId: string) {
    event.dataTransfer?.setData('text/card-id', cardId);
    event.dataTransfer?.setData('text/from-column-id', columnId);
    event.dataTransfer?.setDragImage(new Image(), 0, 0);
  }

  onCardDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onCardDrop(event: DragEvent, toColumnId: string, toIndex: number | null = null) {
    const cardId = event.dataTransfer?.getData('text/card-id');
    const fromColumnId = event.dataTransfer?.getData('text/from-column-id');
    if (!cardId || !fromColumnId) return;

    const fromColumn = this.columns.find(c => c.id === fromColumnId);
    const toColumn = this.columns.find(c => c.id === toColumnId);
    if (!fromColumn || !toColumn) return;

    const cardIndex = fromColumn.cards.findIndex(c => c.id === cardId);
    if (cardIndex < 0) return;
    const [card] = fromColumn.cards.splice(cardIndex, 1);

    if (toIndex === null || toIndex === undefined || toIndex < 0 || toIndex > toColumn.cards.length) {
      toColumn.cards.push(card);
    } else {
      toColumn.cards.splice(toIndex, 0, card);
    }

    this.persist();
  }
}


