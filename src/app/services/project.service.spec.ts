import { TestBed } from '@angular/core/testing';
import { OrderDirection } from '@appstrax/services/database';

import { ProjectUserService } from './project.service';

describe('ProjectUserService', () => {
  let service: ProjectUserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectUserService);
  });

  it('fetches a user’s memberships oldest first so the first row wins deterministically', async () => {
    const find = spyOn(service, 'find').and.resolveTo({ data: [] } as any);
    expect(await service.findByUserId('u1')).toEqual([]);
    expect(find).toHaveBeenCalledOnceWith({
      where: { userId: 'u1' },
      order: { createdAt: OrderDirection.ASC },
    });
  });
});
