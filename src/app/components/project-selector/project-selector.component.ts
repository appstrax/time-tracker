import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../models/project.model';
import { ProjectService } from '../../services/project.service';
import { OrganizationService } from '../../services/organization.service';
import { Organization } from '../../models/organization.model';

@Component({
  selector: 'app-project-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-selector.component.html',
  styleUrls: ['./project-selector.component.scss']
})
export class ProjectSelectorComponent implements OnInit {
  projects: Project[] = [];
  organizations: Organization[] = [];
  selectedProject: Project | null = null;
  isMenuOpen = false;

  constructor(private projectService: ProjectService, private organizationService: OrganizationService) {}

  async ngOnInit(): Promise<void> {
    const projectResults = await this.projectService.find({});
    const organizationResults = await this.organizationService.find({});
    this.projects = projectResults.data;
    this.organizations = organizationResults.data;
    
    if (!this.selectedProject && this.projects.length > 0) {
      this.selectedProject = this.projects[0];
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  selectProject(project: Project): void {
    this.selectedProject = project;
    this.isMenuOpen = false;
  }
}
