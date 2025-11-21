import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Organization } from '@models';

@Component({
  selector: 'app-organization-block',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './organization-block.component.html',
  styleUrl: './organization-block.component.scss'
})
export class OrganizationBlockComponent {
  @Input() organization: Organization | null = null; // null = "All Organizations"
  @Input() isSelected: boolean = false;
  @Input() isAllOrganizations: boolean = false;

  @Output() organizationSelected = new EventEmitter<Organization | null>();

  public onBlockClick(): void {
    this.organizationSelected.emit(this.organization);
  }

  public getDisplayName(): string {
    if (this.isAllOrganizations) return 'All Organizations';
    return this.organization?.name || 'Unknown Organization';
  }
}

