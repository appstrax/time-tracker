import { Component, computed, input, output } from '@angular/core';

import { Project } from '@models';

@Component({
  selector: 'app-projects-block',
  standalone: true,
  imports: [],
  templateUrl: './projects-block.component.html',
  styleUrl: './projects-block.component.scss'
})
export class ProjectsBlockComponent {
  public readonly project = input<Project | null>(null); // null = "All Projects"
  public readonly isSelected = input(false);
  public readonly isAllProjects = input(false);

  public readonly projectSelected = output<Project | null>();
  public readonly displayName = computed(() => {
    if (this.isAllProjects()) return 'All Projects';
    return this.project()?.name || 'Unknown Project';
  });

  public onBlockClick(): void {
    this.projectSelected.emit(this.project());
  }
}

