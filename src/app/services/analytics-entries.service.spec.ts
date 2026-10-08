import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { appstraxAuth } from '@appstrax/services/auth';

import { environment } from '../../environments/environment';
import { TimeSheetEntry } from '../models/time-sheet-entry.model';

import { AnalyticsEntriesService } from './analytics-entries.service';

const dto = (id: string, approved = false) => ({
  id,
  createdAt: '2026-09-01T08:00:00.000Z',
  updatedAt: '2026-09-02T08:00:00.000Z',
  userId: 'u1',
  projectId: 'p1',
  date: '2026-09-01T00:00:00.000Z',
  hours: 2.5,
  description: 'work',
  category: 'Dev',
  fieldValues: [{ key: 'k', value: 'v' }],
  approved,
  billable: true,
});

describe('AnalyticsEntriesService', () => {
  let service: AnalyticsEntriesService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/api/entries`;

  beforeEach(() => {
    spyOn(appstraxAuth, 'getAuthToken').and.resolveTo('tok');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AnalyticsEntriesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const nextRequest = async (url: string) => {
    for (let i = 0; i < 20; i++) {
      const matches = http.match((r) => r.url === url);
      if (matches.length) return matches[0];
      await Promise.resolve();
    }
    throw new Error('no request for ' + url);
  };

  it('GETs entries with joined projectIds, bearer header and maps DTOs', async () => {
    const promise = service.findByProjectIds(['a', 'b']);
    const req = await nextRequest(base);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('projectIds')).toBe('a,b');
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok');
    req.flush({ data: [dto('e1')], meta: {} });

    const [entry] = await promise;
    expect(entry instanceof TimeSheetEntry).toBeTrue();
    expect(entry.date).toEqual(new Date('2026-09-01T00:00:00.000Z'));
    expect(entry.createdAt instanceof Date).toBeTrue();
    expect(entry.updatedAt).toEqual(new Date('2026-09-02T08:00:00.000Z'));
    expect(entry.hours).toBe(2.5);
    expect(entry.fieldValues).toEqual([{ key: 'k', value: 'v' }]);
    expect(entry.clone().id).toBe('e1');
  });

  it('returns no entries for an empty project list without any request', async () => {
    expect(await service.findByProjectIds([])).toEqual([]);
    expect(appstraxAuth.getAuthToken).not.toHaveBeenCalled();
    http.expectNone(() => true);
  });

  it('findAllVisible GETs every visible entry without a projectIds filter', async () => {
    const promise = service.findAllVisible();
    const req = await nextRequest(base);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('projectIds')).toBeFalse();
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok');
    req.flush({ data: [dto('e1')], meta: {} });
    const [entry] = await promise;
    expect(entry instanceof TimeSheetEntry).toBeTrue();
    expect(entry.id).toBe('e1');
  });

  it('PUTs approval and returns the mapped entry', async () => {
    const promise = service.setApproved('e1', true);
    const req = await nextRequest(`${base}/e1/approval`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ approved: true });
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok');
    req.flush({ data: dto('e1', true), meta: {} });

    const entry = await promise;
    expect(entry instanceof TimeSheetEntry).toBeTrue();
    expect(entry.approved).toBeTrue();
    expect(entry.date instanceof Date).toBeTrue();
  });

  it('propagates read errors', async () => {
    const promise = service.findByProjectIds(['a']);
    (await nextRequest(base)).flush(
      { message: 'Forbidden' },
      { status: 403, statusText: 'Forbidden' },
    );
    await expectAsync(promise).toBeRejected();
  });

  it('propagates approval errors', async () => {
    const promise = service.setApproved('e1', false);
    (await nextRequest(`${base}/e1/approval`)).flush(
      { message: 'Forbidden' },
      { status: 403, statusText: 'Forbidden' },
    );
    await expectAsync(promise).toBeRejected();
  });

  it('PUTs billable status and returns the mapped entry', async () => {
    const promise = service.setBillable('e1', false);
    const req = await nextRequest(`${base}/e1/billable`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ billable: false });
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok');
    req.flush({ data: { ...dto('e1'), billable: false }, meta: {} });

    const entry = await promise;
    expect(entry instanceof TimeSheetEntry).toBeTrue();
    expect(entry.billable).toBeFalse();
  });

  it('propagates billable update errors', async () => {
    const promise = service.setBillable('e1', true);
    (await nextRequest(`${base}/e1/billable`)).flush(
      { message: 'Forbidden' },
      { status: 403, statusText: 'Forbidden' },
    );
    await expectAsync(promise).toBeRejected();
  });
});
