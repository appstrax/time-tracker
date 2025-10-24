import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-marketplace',
  templateUrl: './marketplace.page.html',
  styleUrls: ['./marketplace.page.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class MarketplacePage {
  activeTab: 'browse' | 'myBids' | 'myListings' = 'browse';

  categories = ['Web', 'Mobile', 'API', 'DevOps', 'AI/ML', 'Data'];

  filters = {
    query: '',
    category: '',
    remoteOnly: false,
    budgetMin: 0,
    budgetMax: 0,
  };

  currentUserId = 'me';

  projects: Array<{
    id: number;
    title: string;
    organization: string;
    category: string;
    remote: boolean;
    budget: number;
    timeframeWeeks: number;
    tags: string[];
    description: string;
    applicants: number;
    posted: string;
    saved?: boolean;
    ownerId?: string;
  }> = [
    {
      id: 101,
      title: 'Marketing Site Revamp (Angular)',
      organization: 'Acme Co.',
      category: 'Web',
      remote: true,
      budget: 5000,
      timeframeWeeks: 3,
      tags: ['Angular', 'SCSS', 'Bootstrap'],
      description: 'Rebuild our public marketing site with a new design system.',
      applicants: 6,
      posted: '2d ago',
      saved: false,
      ownerId: 'other',
    },
    {
      id: 102,
      title: 'CI/CD Pipeline for Monorepo',
      organization: 'BlueSky Labs',
      category: 'DevOps',
      remote: true,
      budget: 3000,
      timeframeWeeks: 2,
      tags: ['GitHub Actions', 'Nx', 'Caching'],
      description: 'Set up efficient pipelines with caching and preview deployments.',
      applicants: 3,
      posted: '5d ago',
      saved: true,
      ownerId: 'other',
    },
    {
      id: 103,
      title: 'Generate Reporting API',
      organization: 'DataFlow Inc.',
      category: 'API',
      remote: false,
      budget: 8000,
      timeframeWeeks: 6,
      tags: ['Node', 'Postgres', 'REST'],
      description: 'Create endpoints for scheduled and on-demand reports.',
      applicants: 9,
      posted: '1w ago',
      saved: false,
      ownerId: 'me',
    },
  ];

  myBids: Array<{ projectId: number; status: 'Pending' | 'Accepted' | 'Declined'; amount: number }>= [
    { projectId: 101, status: 'Pending', amount: 5200 },
  ];

  setTab(tab: 'browse' | 'myBids' | 'myListings') {
    this.activeTab = tab;
  }

  get displayedProjects() {
    if (this.activeTab === 'myListings') {
      return this.applyFilters(this.projects.filter((p) => p.ownerId === this.currentUserId));
    }
    if (this.activeTab === 'myBids') {
      const ids = new Set(this.myBids.map((b) => b.projectId));
      return this.applyFilters(this.projects.filter((p) => ids.has(p.id)));
    }
    return this.applyFilters(this.projects);
  }

  private applyFilters(list: typeof this.projects) {
    return list.filter((p) => {
      if (this.filters.query) {
        const q = this.filters.query.toLowerCase();
        if (!p.title.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
      }
      if (this.filters.category && p.category !== this.filters.category) return false;
      if (this.filters.remoteOnly && !p.remote) return false;
      if (this.filters.budgetMin && p.budget < this.filters.budgetMin) return false;
      if (this.filters.budgetMax && p.budget > this.filters.budgetMax) return false;
      return true;
    });
  }

  toggleSave(projectId: number) {
    const p = this.projects.find((x) => x.id === projectId);
    if (p) p.saved = !p.saved;
  }

  placeBid(projectId: number) {
    const exists = this.myBids.find((b) => b.projectId === projectId);
    if (!exists) this.myBids.push({ projectId, status: 'Pending', amount: 0 });
  }

  viewProject(projectId: number) {
    // Placeholder: route to project view/details when available
    this.router.navigate(['/project'], { queryParams: { from: 'marketplace', id: projectId } });
  }

  postProject() {
    this.router.navigate(['/create-project'], { queryParams: { from: 'marketplace' } });
  }

  constructor(private router: Router) {}
} 