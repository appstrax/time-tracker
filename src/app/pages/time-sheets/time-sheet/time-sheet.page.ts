import { Component, OnInit, Signal } from '@angular/core';

import { appstraxAuth, User } from '@appstrax/services/auth';
import { TimeSheetEntry } from 'src/app/models/time-sheet-entry.model';
import { TimeSheetEntryService } from 'src/app/services/time-sheet-entry.service';
import { TimeSheetDayComponent } from './components/time-sheet-day/time-sheet-day.component';
import { TimeSheetDateSelectorComponent } from './components/time-sheet-date-selector/time-sheet-date-selector.component';
import { ColorList } from 'src/app/utils/color-list';
import { Store } from '@state';
import { Project } from '@models';

@Component({
  selector: 'app-time-sheet',
  imports: [TimeSheetDayComponent, TimeSheetDateSelectorComponent],
  standalone: true,
  templateUrl: './time-sheet.page.html',
  styleUrl: './time-sheet.page.scss'
})
export class TimeSheetPage implements OnInit {
  public timeSheetEntries: TimeSheetEntry[] = [];
  public user: User | null = null;
  public currentWeekStart: Date = new Date();
  public currentWeekEnd: Date = new Date();
  public weekDays: Date[] = [];

  projects: Signal<Project[]>;

  categoryColors: Map<string, string> = new Map<string, string>();

  constructor(private timeSheetEntryService: TimeSheetEntryService, private store: Store) {
    this.projects = this.store.projects.all;
  }

  async ngOnInit(): Promise<void> {
    const user = await appstraxAuth.getUser();
    if (!user) return;
    this.user = user;
    this.initializeWeekDays();
    await this.setTimeSheetEntries();
    this.initializeCategoryColors();
  }

  initializeWeekDays(): void {
    const today = new Date();
    const dayOfWeek = today.getUTCDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    this.currentWeekStart = new Date(today);
    this.currentWeekStart.setUTCDate(today.getUTCDate() + diff);
    this.currentWeekStart.setUTCHours(0, 0, 0, 0);

    this.currentWeekEnd = new Date(this.currentWeekStart);
    this.currentWeekEnd.setUTCDate(this.currentWeekStart.getUTCDate() + 6);
    this.currentWeekEnd.setUTCHours(23, 59, 59, 999);

    this.updateWeekDays();
  }

  async setTimeSheetEntries(): Promise<void> {
    // this.timeSheetEntries = this.testEntries;
    this.timeSheetEntries = await this.timeSheetEntryService.getTimeSheetEntriesByUserId(this.user?.id ?? '');

  }

  async onTimeSheetEntrySaved(entry: TimeSheetEntry): Promise<void> {
    await this.setTimeSheetEntries();
    this.initializeCategoryColors();
  }

  updateWeekDays(): void {
    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(this.currentWeekStart);
      date.setUTCDate(this.currentWeekStart.getUTCDate() + i);
      this.weekDays.push(date);
    }
  }

  onWeekChange(weekRange: { start: Date; end: Date }): void {
    this.currentWeekStart = weekRange.start;
    this.currentWeekEnd = weekRange.end;
    this.updateWeekDays();
  }


  filterEntriesByDate(date: Date): TimeSheetEntry[] {
    let filteredEntries: TimeSheetEntry[] = this.timeSheetEntries.filter(
      entry => entry.date.toDateString() === date.toDateString(),
    );
    return filteredEntries;
  }


  initializeCategoryColors(): void {
    const categories = [...new Set(this.timeSheetEntries.map(entry => entry.category))];
    for (let i = 0; i < categories.length; i++) {
      this.categoryColors.set(categories[i], ColorList.colors[i]);
    }
  }

  getAvailableCategories(): string[] {
    return [...new Set(this.timeSheetEntries.map(entry => entry.category).filter(cat => cat && cat.trim() !== ''))];
  }

  generateDistinctColors(n: number, startHue = 0, saturation = 70, lightness = 55): string[] {
    const colors = [];
    const hueStep = 360 / n;

    for (let i = 0; i < n; i++) {
      const hue = (startHue + i * hueStep) % 360;
      colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    return colors;
  }

  public testEntries: TimeSheetEntry[] = [
    {
      id: '1',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-27T00:00:00Z'),
      hours: 2.5,
      description: 'Feature development and code implementation',
      category: 'Development'
    } as TimeSheetEntry,
    {
      id: '2',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-27T00:00:00Z'),
      hours: 1.25,
      description: 'Code review and peer feedback',
      category: 'Review'
    } as TimeSheetEntry,
    {
      id: '3',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-28T00:00:00Z'),
      hours: 3.75,
      description: 'UI/UX design mockups and wireframes',
      category: 'Design'
    } as TimeSheetEntry,
    {
      id: '4',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-03-28T00:00:00Z'),
      hours: 0.5,
      description: 'Infrastructure setup and deployment',
      category: 'DevOps'
    } as TimeSheetEntry,
    {
      id: '5',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-29T00:00:00Z'),
      hours: 4,
      description: 'API documentation and technical writing',
      category: 'Documentation'
    } as TimeSheetEntry,
    {
      id: '6',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-29T00:00:00Z'),
      hours: 1.5,
      description: 'Unit and integration testing',
      category: 'Testing'
    } as TimeSheetEntry,
    {
      id: '7',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-30T00:00:00Z'),
      hours: 2,
      description: 'Sprint planning and task estimation',
      category: 'Planning'
    } as TimeSheetEntry,
    {
      id: '8',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-30T00:00:00Z'),
      hours: 0.25,
      description: 'Quick bug fix in authentication module',
      category: 'Development'
    } as TimeSheetEntry,
    {
      id: '9',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-31T00:00:00Z'),
      hours: 3,
      description: 'Database schema design and optimization',
      category: 'Development'
    } as TimeSheetEntry,
    {
      id: '10',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-11-01T00:00:00Z'),
      hours: 1.75,
      description: 'Design system component library updates',
      category: 'Design'
    } as TimeSheetEntry,
    {
      id: '11',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-11-01T00:00:00Z'),
      hours: 0.75,
      description: 'PR review and merge conflict resolution',
      category: 'Review'
    } as TimeSheetEntry,
    {
      id: '12',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-11-02T00:00:00Z'),
      hours: 2.25,
      description: 'CI/CD pipeline configuration',
      category: 'DevOps'
    } as TimeSheetEntry,
    {
      id: '13',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-11-03T00:00:00Z'),
      hours: 1,
      description: 'User guide documentation update',
      category: 'Documentation'
    } as TimeSheetEntry,
    {
      id: '14',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-11-03T00:00:00Z'),
      hours: 3.5,
      description: 'End-to-end test suite development',
      category: 'Testing'
    } as TimeSheetEntry,
    {
      id: '15',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-11-04T00:00:00Z'),
      hours: 0.5,
      description: 'Team standup and sprint retrospective',
      category: 'Planning'
    } as TimeSheetEntry,
    {
      id: '16',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-11-05T00:00:00Z'),
      hours: 2.75,
      description: 'Feature implementation and refactoring',
      category: 'Development'
    } as TimeSheetEntry,
    {
      id: '17',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-11-06T00:00:00Z'),
      hours: 1.25,
      description: 'Visual design and asset creation',
      category: 'Design'
    } as TimeSheetEntry,
    {
      id: '18',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-11-07T00:00:00Z'),
      hours: 0.25,
      description: 'Performance testing and optimization',
      category: 'Testing'
    } as TimeSheetEntry,
    {
      id: '19',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-11-08T00:00:00Z'),
      hours: 4,
      description: 'Production deployment and monitoring setup',
      category: 'DevOps'
    } as TimeSheetEntry,
    {
      id: '20',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-11-09T00:00:00Z'),
      hours: 1.5,
      description: 'Project roadmap and milestone planning',
      category: 'Planning'
    } as TimeSheetEntry,
    {
      id: '21',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-08-27T00:00:00Z'),
      hours: 0.75,
      description: 'Frontend component development',
      category: 'Development'
    } as TimeSheetEntry,
    {
      id: '22',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-27T00:00:00Z'),
      hours: 2.25,
      description: 'API endpoint testing and validation',
      category: 'Testing'
    } as TimeSheetEntry,
    {
      id: '23',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-28T00:00:00Z'),
      hours: 1.5,
      description: 'User experience flow improvements',
      category: 'Design'
    } as TimeSheetEntry,
    {
      id: '24',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-28T00:00:00Z'),
      hours: 3.25,
      description: 'Backend service implementation',
      category: 'Development'
    } as TimeSheetEntry,
    {
      id: '25',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-29T00:00:00Z'),
      hours: 0.5,
      description: 'Security audit and code review',
      category: 'Review'
    } as TimeSheetEntry,
    {
      id: '26',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-29T00:00:00Z'),
      hours: 2.5,
      description: 'Cloud infrastructure migration',
      category: 'DevOps'
    } as TimeSheetEntry,
    {
      id: '27',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-30T00:00:00Z'),
      hours: 1.75,
      description: 'Technical specification documentation',
      category: 'Documentation'
    } as TimeSheetEntry,
    {
      id: '28',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-30T00:00:00Z'),
      hours: 3.75,
      description: 'Load testing and performance analysis',
      category: 'Testing'
    } as TimeSheetEntry,
    {
      id: '29',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-31T00:00:00Z'),
      hours: 0.25,
      description: 'Quick bug fix in payment module',
      category: 'Development'
    } as TimeSheetEntry,
    {
      id: '30',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-31T00:00:00Z'),
      hours: 2,
      description: 'Feature prioritization meeting',
      category: 'Planning'
    } as TimeSheetEntry,
    {
      id: '31',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-11-01T00:00:00Z'),
      hours: 1.25,
      description: 'Design system consistency check',
      category: 'Design'
    } as TimeSheetEntry,
    {
      id: '32',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-11-01T00:00:00Z'),
      hours: 4,
      description: 'Full stack feature development',
      category: 'Development'
    } as TimeSheetEntry,
    {
      id: '33',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-11-02T00:00:00Z'),
      hours: 0.5,
      description: 'Code quality review and refactoring',
      category: 'Review'
    } as TimeSheetEntry,
    {
      id: '34',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-11-02T00:00:00Z'),
      hours: 2.75,
      description: 'Docker containerization setup',
      category: 'DevOps'
    } as TimeSheetEntry,
    {
      id: '35',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-11-03T00:00:00Z'),
      hours: 1,
      description: 'Developer onboarding guide creation',
      category: 'Documentation'
    } as TimeSheetEntry,
    {
      id: '36',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-11-03T00:00:00Z'),
      hours: 0.25,
      description: 'Regression test suite execution',
      category: 'Testing'
    } as TimeSheetEntry,
    {
      id: '37',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-11-04T00:00:00Z'),
      hours: 3,
      description: 'Architecture decision record writing',
      category: 'Documentation'
    } as TimeSheetEntry,
    {
      id: '38',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-11-04T00:00:00Z'),
      hours: 1.5,
      description: 'Sprint backlog refinement session',
      category: 'Planning'
    } as TimeSheetEntry,
    {
      id: '39',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-11-05T00:00:00Z'),
      hours: 0.75,
      description: 'Mobile responsive design updates',
      category: 'Design'
    } as TimeSheetEntry,
    {
      id: '40',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-11-05T00:00:00Z'),
      hours: 2.5,
      description: 'Database query optimization',
      category: 'Development'
    } as TimeSheetEntry,
    {
      id: '41',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-11-06T00:00:00Z'),
      hours: 1.75,
      description: 'Pull request review and approval',
      category: 'Review'
    } as TimeSheetEntry,
    {
      id: '42',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-11-06T00:00:00Z'),
      hours: 3.5,
      description: 'Automated testing framework setup',
      category: 'Testing'
    } as TimeSheetEntry,
    {
      id: '43',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-11-07T00:00:00Z'),
      hours: 0.5,
      description: 'Server monitoring and alerting configuration',
      category: 'DevOps'
    } as TimeSheetEntry,
    {
      id: '44',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-11-07T00:00:00Z'),
      hours: 2.25,
      description: 'API reference documentation',
      category: 'Documentation'
    } as TimeSheetEntry,
    {
      id: '45',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-11-08T00:00:00Z'),
      hours: 1.25,
      description: 'Product requirements gathering',
      category: 'Planning'
    } as TimeSheetEntry,
    {
      id: '46',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-11-08T00:00:00Z'),
      hours: 3.25,
      description: 'Microservices architecture design',
      category: 'Development'
    } as TimeSheetEntry,
    {
      id: '47',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-11-09T00:00:00Z'),
      hours: 0.75,
      description: 'User interface mockup creation',
      category: 'Design'
    } as TimeSheetEntry,
    {
      id: '48',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-11-09T00:00:00Z'),
      hours: 2,
      description: 'Integration test development',
      category: 'Testing'
    } as TimeSheetEntry,
    {
      id: '49',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-27T00:00:00Z'),
      hours: 1,
      description: 'Kubernetes cluster configuration',
      category: 'DevOps'
    } as TimeSheetEntry,
    {
      id: '50',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-28T00:00:00Z'),
      hours: 2.5,
      description: 'Release notes documentation',
      category: 'Documentation'
    } as TimeSheetEntry,
    {
      id: '51',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-29T00:00:00Z'),
      hours: 0.5,
      description: 'Quarterly planning session',
      category: 'Planning'
    } as TimeSheetEntry,
    {
      id: '52',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-30T00:00:00Z'),
      hours: 3.75,
      description: 'Advanced feature implementation',
      category: 'Development'
    } as TimeSheetEntry,
    {
      id: '53',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-31T00:00:00Z'),
      hours: 1.5,
      description: 'Design pattern application review',
      category: 'Review'
    } as TimeSheetEntry,
    {
      id: '54',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-11-01T00:00:00Z'),
      hours: 0.25,
      description: 'Color palette and typography updates',
      category: 'Design'
    } as TimeSheetEntry,
    {
      id: '55',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-11-02T00:00:00Z'),
      hours: 4,
      description: 'Comprehensive system testing',
      category: 'Testing'
    } as TimeSheetEntry,
    {
      id: '56',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-11-03T00:00:00Z'),
      hours: 1.75,
      description: 'Database backup automation',
      category: 'DevOps'
    } as TimeSheetEntry,
    {
      id: '57',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-11-04T00:00:00Z'),
      hours: 2.25,
      description: 'Technical blog post writing',
      category: 'Documentation'
    } as TimeSheetEntry,
    {
      id: '58',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-11-05T00:00:00Z'),
      hours: 0.5,
      description: 'Feature scope definition meeting',
      category: 'Planning'
    } as TimeSheetEntry,
    {
      id: '59',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-11-06T00:00:00Z'),
      hours: 3,
      description: 'Legacy code modernization',
      category: 'Development'
    } as TimeSheetEntry,
    {
      id: '60',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-11-07T00:00:00Z'),
      hours: 1.25,
      description: 'Code security review',
      category: 'Review'
    } as TimeSheetEntry,
    {
      id: '61',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-13T00:00:00Z'),
      hours: 2.5,
      description: 'Technology research and evaluation',
      category: 'Research'
    } as TimeSheetEntry,
    {
      id: '62',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-13T00:00:00Z'),
      hours: 1.75,
      description: 'Team training on new framework',
      category: 'Training'
    } as TimeSheetEntry,
    {
      id: '63',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-14T00:00:00Z'),
      hours: 0.5,
      description: 'Customer support ticket resolution',
      category: 'Support'
    } as TimeSheetEntry,
    {
      id: '64',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-14T00:00:00Z'),
      hours: 3.25,
      description: 'System maintenance and updates',
      category: 'Maintenance'
    } as TimeSheetEntry,
    {
      id: '65',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-15T00:00:00Z'),
      hours: 2,
      description: 'Quality assurance testing',
      category: 'Quality Assurance'
    } as TimeSheetEntry,
    {
      id: '66',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-15T00:00:00Z'),
      hours: 1.25,
      description: 'System architecture design',
      category: 'Architecture'
    } as TimeSheetEntry,
    {
      id: '67',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-16T00:00:00Z'),
      hours: 4,
      description: 'React component development',
      category: 'Frontend'
    } as TimeSheetEntry,
    {
      id: '68',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-16T00:00:00Z'),
      hours: 0.25,
      description: 'API endpoint implementation',
      category: 'Backend'
    } as TimeSheetEntry,
    {
      id: '69',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-17T00:00:00Z'),
      hours: 2.75,
      description: 'Database schema migration',
      category: 'Database'
    } as TimeSheetEntry,
    {
      id: '70',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-17T00:00:00Z'),
      hours: 1.5,
      description: 'Security vulnerability assessment',
      category: 'Security'
    } as TimeSheetEntry,
    {
      id: '71',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-18T00:00:00Z'),
      hours: 3,
      description: 'Market analysis and competitor research',
      category: 'Research'
    } as TimeSheetEntry,
    {
      id: '72',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-18T00:00:00Z'),
      hours: 0.75,
      description: 'Onboarding new team member',
      category: 'Training'
    } as TimeSheetEntry,
    {
      id: '73',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-19T00:00:00Z'),
      hours: 1.25,
      description: 'Technical support and troubleshooting',
      category: 'Support'
    } as TimeSheetEntry,
    {
      id: '74',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-19T00:00:00Z'),
      hours: 2.5,
      description: 'Performance optimization and tuning',
      category: 'Maintenance'
    } as TimeSheetEntry,
    {
      id: '75',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-20T00:00:00Z'),
      hours: 0.5,
      description: 'Manual testing and bug verification',
      category: 'Quality Assurance'
    } as TimeSheetEntry,
    {
      id: '76',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-20T00:00:00Z'),
      hours: 3.75,
      description: 'Scalability architecture planning',
      category: 'Architecture'
    } as TimeSheetEntry,
    {
      id: '77',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-21T00:00:00Z'),
      hours: 1,
      description: 'Vue.js component library updates',
      category: 'Frontend'
    } as TimeSheetEntry,
    {
      id: '78',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-21T00:00:00Z'),
      hours: 2.25,
      description: 'Microservices implementation',
      category: 'Backend'
    } as TimeSheetEntry,
    {
      id: '79',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-22T00:00:00Z'),
      hours: 1.75,
      description: 'Query optimization and indexing',
      category: 'Database'
    } as TimeSheetEntry,
    {
      id: '80',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-22T00:00:00Z'),
      hours: 0.25,
      description: 'Penetration testing preparation',
      category: 'Security'
    } as TimeSheetEntry,
    {
      id: '81',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-23T00:00:00Z'),
      hours: 2,
      description: 'User behavior research and analytics',
      category: 'Research'
    } as TimeSheetEntry,
    {
      id: '82',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-23T00:00:00Z'),
      hours: 3.5,
      description: 'Workshop on best practices',
      category: 'Training'
    } as TimeSheetEntry,
    {
      id: '83',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-24T00:00:00Z'),
      hours: 0.75,
      description: 'Client support and issue resolution',
      category: 'Support'
    } as TimeSheetEntry,
    {
      id: '84',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-24T00:00:00Z'),
      hours: 4,
      description: 'System backup and recovery procedures',
      category: 'Maintenance'
    } as TimeSheetEntry,
    {
      id: '85',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-25T00:00:00Z'),
      hours: 1.5,
      description: 'Regression testing suite execution',
      category: 'Quality Assurance'
    } as TimeSheetEntry,
    {
      id: '86',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-25T00:00:00Z'),
      hours: 2.25,
      description: 'Cloud infrastructure architecture',
      category: 'Architecture'
    } as TimeSheetEntry,
    {
      id: '87',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-26T00:00:00Z'),
      hours: 0.5,
      description: 'Angular directive development',
      category: 'Frontend'
    } as TimeSheetEntry,
    {
      id: '88',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-26T00:00:00Z'),
      hours: 3.25,
      description: 'RESTful API design and implementation',
      category: 'Backend'
    } as TimeSheetEntry,
    {
      id: '89',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-13T00:00:00Z'),
      hours: 1.25,
      description: 'Data normalization and cleanup',
      category: 'Database'
    } as TimeSheetEntry,
    {
      id: '90',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2024-10-14T00:00:00Z'),
      hours: 2,
      description: 'Security audit and compliance check',
      category: 'Security'
    } as TimeSheetEntry,
    {
      id: '91',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2024-09-29T00:00:00Z'),
      hours: 1.5,
      description: 'Team standup and project sync meeting',
      category: 'Meeting'
    } as TimeSheetEntry,
    {
      id: '92',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-09-29T00:00:00Z'),
      hours: 2.75,
      description: 'Data analysis and metrics evaluation',
      category: 'Analysis'
    } as TimeSheetEntry,
    {
      id: '93',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-09-30T00:00:00Z'),
      hours: 0.5,
      description: 'Weekly progress report generation',
      category: 'Reporting'
    } as TimeSheetEntry,
    {
      id: '94',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-09-30T00:00:00Z'),
      hours: 3,
      description: 'Staging environment deployment',
      category: 'Deployment'
    } as TimeSheetEntry,
    {
      id: '95',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-01T00:00:00Z'),
      hours: 1.25,
      description: 'Application performance monitoring',
      category: 'Monitoring'
    } as TimeSheetEntry,
    {
      id: '96',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-01T00:00:00Z'),
      hours: 2.5,
      description: 'Third-party API integration',
      category: 'Integration'
    } as TimeSheetEntry,
    {
      id: '97',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-02T00:00:00Z'),
      hours: 0.75,
      description: 'Environment configuration setup',
      category: 'Configuration'
    } as TimeSheetEntry,
    {
      id: '98',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-02T00:00:00Z'),
      hours: 3.75,
      description: 'Code performance optimization',
      category: 'Optimization'
    } as TimeSheetEntry,
    {
      id: '99',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-03T00:00:00Z'),
      hours: 1,
      description: 'Data migration to new database',
      category: 'Migration'
    } as TimeSheetEntry,
    {
      id: '100',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-03T00:00:00Z'),
      hours: 2.25,
      description: 'Cross-team collaboration session',
      category: 'Collaboration'
    } as TimeSheetEntry,
    {
      id: '101',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-04T00:00:00Z'),
      hours: 0.25,
      description: 'Client feedback discussion meeting',
      category: 'Meeting'
    } as TimeSheetEntry,
    {
      id: '102',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-04T00:00:00Z'),
      hours: 4,
      description: 'User behavior pattern analysis',
      category: 'Analysis'
    } as TimeSheetEntry,
    {
      id: '103',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-05T00:00:00Z'),
      hours: 1.75,
      description: 'Monthly metrics report preparation',
      category: 'Reporting'
    } as TimeSheetEntry,
    {
      id: '104',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-05T00:00:00Z'),
      hours: 0.5,
      description: 'Hotfix deployment to production',
      category: 'Deployment'
    } as TimeSheetEntry,
    {
      id: '105',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-06T00:00:00Z'),
      hours: 2,
      description: 'Error tracking and alert monitoring',
      category: 'Monitoring'
    } as TimeSheetEntry,
    {
      id: '106',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-06T00:00:00Z'),
      hours: 3.25,
      description: 'Payment gateway integration',
      category: 'Integration'
    } as TimeSheetEntry,
    {
      id: '107',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-07T00:00:00Z'),
      hours: 1.5,
      description: 'Development environment configuration',
      category: 'Configuration'
    } as TimeSheetEntry,
    {
      id: '108',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-07T00:00:00Z'),
      hours: 0.75,
      description: 'Bundle size optimization',
      category: 'Optimization'
    } as TimeSheetEntry,
    {
      id: '109',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-08T00:00:00Z'),
      hours: 2.5,
      description: 'Legacy system migration planning',
      category: 'Migration'
    } as TimeSheetEntry,
    {
      id: '110',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-08T00:00:00Z'),
      hours: 1.25,
      description: 'Pair programming session',
      category: 'Collaboration'
    } as TimeSheetEntry,
    {
      id: '111',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-09T00:00:00Z'),
      hours: 3,
      description: 'Sprint planning and retrospective meeting',
      category: 'Meeting'
    } as TimeSheetEntry,
    {
      id: '112',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-09T00:00:00Z'),
      hours: 1,
      description: 'Performance bottleneck analysis',
      category: 'Analysis'
    } as TimeSheetEntry,
    {
      id: '113',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-10T00:00:00Z'),
      hours: 2.25,
      description: 'Executive summary report writing',
      category: 'Reporting'
    } as TimeSheetEntry,
    {
      id: '114',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-10T00:00:00Z'),
      hours: 1.75,
      description: 'Automated deployment pipeline setup',
      category: 'Deployment'
    } as TimeSheetEntry,
    {
      id: '115',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-11T00:00:00Z'),
      hours: 0.5,
      description: 'Server health monitoring dashboard',
      category: 'Monitoring'
    } as TimeSheetEntry,
    {
      id: '116',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-11T00:00:00Z'),
      hours: 3.5,
      description: 'OAuth authentication integration',
      category: 'Integration'
    } as TimeSheetEntry,
    {
      id: '117',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-10-12T00:00:00Z'),
      hours: 2,
      description: 'Feature flag configuration',
      category: 'Configuration'
    } as TimeSheetEntry,
    {
      id: '118',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2025-10-12T00:00:00Z'),
      hours: 1.5,
      description: 'Memory usage optimization',
      category: 'Optimization'
    } as TimeSheetEntry,
    {
      id: '119',
      userId: 'user-1',
      projectId: 'f712c3af-2ade-45d6-8163-ee51216ce271',
      date: new Date('2025-09-29T00:00:00Z'),
      hours: 3.25,
      description: 'Cloud infrastructure migration',
      category: 'Migration'
    } as TimeSheetEntry,
    {
      id: '120',
      userId: 'user-1',
      projectId: '4336268c-fe8a-49ac-b6ad-9eba49a0b9ab',
      date: new Date('2024-09-30T00:00:00Z'),
      hours: 0.5,
      description: 'Code review collaboration',
      category: 'Collaboration'
    } as TimeSheetEntry
  ];




}
