import { Injectable } from '@angular/core';
import { CrudService } from '@appstrax/services/database';
import { Interest } from '@models';

@Injectable({ providedIn: 'root' })
export class InterestService extends CrudService<Interest> {
  constructor() {
    super('beta-interests', Interest);
  }
}


