import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { Router, RouterModule } from '@angular/router';
import { Project } from '../../../models/project.model';

@Component({
  selector: 'app-create-project',
  templateUrl: './create-project.page.html',
  styleUrls: ['./create-project.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class CreateProjectPage {
  project: Project = new Project();

  constructor(private router: Router) {}

  public async submit() {
    console.log('Submitting project: ', this.project);
    this.router.navigate(['/home']);
  }
}
