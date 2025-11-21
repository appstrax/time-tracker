import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@state';
import { Project } from '@models';
import { ProjectsBlockComponent } from '../projects-block/projects-block.component';

@Component({
  selector: 'app-organization-projects-block',
  standalone: true,
  imports: [CommonModule, ProjectsBlockComponent],
  templateUrl: './organization-projects-block.component.html',
  styleUrl: './organization-projects-block.component.scss'
})
export class OrganizationProjectsBlockComponent implements OnInit, OnChanges {
  @Input() organizationId: string | null = null;
  @Input() selectedProject: Project | null = null;

  @Output() projectSelected = new EventEmitter<Project | null>();

  public projects: Project[] = [];
  public isLoading: boolean = false;
  public isExpanded: boolean = false;

  private store = inject(Store);

  ngOnInit(): void {
    if (this.organizationId) {
      this.loadProjects();
      this.isExpanded = true;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['organizationId'] && this.organizationId) {
      this.loadProjects();
      this.isExpanded = true;
    } else if (changes['organizationId'] && !this.organizationId) {
      this.isExpanded = false;
      this.projects = [];
    }
  }

  public onProjectSelected(project: Project | null): void {
    this.projectSelected.emit(project);
  }

  public isProjectSelected(project: Project | null): boolean {
    if (!project && !this.selectedProject) return true;
    if (!project || !this.selectedProject) return false;
    return project.id === this.selectedProject.id;
  }

  private loadProjects(): void {
    if (!this.organizationId) return;

    this.isLoading = true;
    try {
      const orgProjects = this.store.orgProjects.byOrganizationId(this.organizationId)();
      const allProjects = this.store.projects.all();
      const projectIds = orgProjects.map(op => op.projectId);
      this.projects = allProjects.filter(p => projectIds.includes(p.id));
    } catch (error) {
      console.error('Error loading projects:', error);
      this.projects = [];
    } finally {
      this.isLoading = false;
    }
  }
}

