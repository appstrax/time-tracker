import { TestBed } from '@angular/core/testing';

import { Project, TimeSheetEntry, User } from '@models';

import { TimeSheetExportUtil } from './time-sheet-export.util';

describe('TimeSheetExportUtil', () => {
  let util: TimeSheetExportUtil;
  let createdBlobs: Blob[];
  let createObjectURLSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    util = TestBed.inject(TimeSheetExportUtil);

    createdBlobs = [];
    createObjectURLSpy = spyOn(URL, 'createObjectURL').and.callFake(
      (blob: Blob) => {
        createdBlobs.push(blob);
        return 'blob:mock-url';
      },
    );
    spyOn(URL, 'revokeObjectURL');
  });

  function formatDate(date?: Date): string {
    if (!date) return '';
    return date.toISOString().slice(0, 10);
  }

  function makeEntry(overrides: Partial<TimeSheetEntry> = {}): TimeSheetEntry {
    const entry = new TimeSheetEntry();
    entry.userId = 'user-1';
    entry.projectId = 'project-1';
    entry.date = new Date('2026-09-20T12:00:00Z');
    entry.hours = 2;
    entry.category = 'General';
    entry.description = 'did work';
    entry.approved = false;
    Object.assign(entry, overrides);
    return entry;
  }

  async function csvTextFor(action: () => void): Promise<string> {
    action();
    expect(createObjectURLSpy).toHaveBeenCalled();
    const blob = createdBlobs[createdBlobs.length - 1];
    return blob.text();
  }

  const project = { id: 'project-1', name: 'Alpha', fields: [] } as any as Project;
  const user = { id: 'user-1', name: 'Jane', surname: 'Doe' } as any as User;

  it('neutralizes a leading "=" so the cell is not evaluated as a formula', async () => {
    const entry = makeEntry({
      description: '=HYPERLINK("http://evil.example","click")',
    });

    const csv = await csvTextFor(() =>
      util.exportFilteredEntries([entry], [project], [user], {}, formatDate),
    );

    expect(csv).not.toContain('"=HYPERLINK');
    expect(csv).toContain("'=HYPERLINK");
  });

  it('neutralizes leading +, -, and @ characters', async () => {
    const plus = makeEntry({ description: '+1+1' });
    const minus = makeEntry({ description: '-2+3' });
    const at = makeEntry({ description: '@SUM(1,2)' });

    const csv = await csvTextFor(() =>
      util.exportFilteredEntries(
        [plus, minus, at],
        [project],
        [user],
        {},
        formatDate,
      ),
    );

    expect(csv).toContain("'+1+1");
    expect(csv).toContain("'-2+3");
    expect(csv).toContain("'@SUM(1,2)");
  });

  it('leaves ordinary text untouched', async () => {
    const entry = makeEntry({ description: 'ordinary description' });

    const csv = await csvTextFor(() =>
      util.exportFilteredEntries([entry], [project], [user], {}, formatDate),
    );

    expect(csv).toContain('ordinary description');
    expect(csv).not.toContain("'ordinary description");
  });

  it('still quotes and escapes a formula-guarded value that also contains a comma', async () => {
    const entry = makeEntry({ description: '=A1,B1' });

    const csv = await csvTextFor(() =>
      util.exportFilteredEntries([entry], [project], [user], {}, formatDate),
    );

    expect(csv).toContain('"\'=A1,B1"');
  });
});
