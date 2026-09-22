import { Injectable } from '@angular/core';
import { Project, User } from '@models';

@Injectable({ providedIn: 'root' })
export class TimeSheetDisplayUtil {
  private readonly defaultUnknownProject = 'Unknown Project';
  private readonly defaultUnknownUser = 'Unknown User';

  public formatHours(hours: number): string {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);

    let formattedMinutes = `${minutes}m`;
    if (minutes < 10) formattedMinutes = '0' + formattedMinutes;
    let formattedHours = `${wholeHours}h`;

    return `${formattedHours} ${formattedMinutes}`;
  }

  public getProjectName(projectId: string, projects?: Project[]): string {
    if (!projectId) {
      return this.defaultUnknownProject;
    }
    const source = projects ?? [];
    const project = source.find((p) => p.id === projectId);
    return project?.name || this.defaultUnknownProject;
  }

  public getUserName(userId: string, user?: User): string {
    if (!userId) {
      return '';
    }

    if (!user) {
      return this.defaultUnknownUser;
    }

    const fullName = `${user.name} ${user.surname}`.trim();
    return fullName || user.email || this.defaultUnknownUser;
  }
}
