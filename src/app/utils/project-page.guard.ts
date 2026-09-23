import { CanDeactivateFn } from '@angular/router';

import { ProjectPage } from '@pages';

export const projectPageCanDeactivate: CanDeactivateFn<ProjectPage> = (
  component,
) => component.canLeaveProjectPage();
