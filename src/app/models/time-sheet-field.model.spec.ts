import { Project } from './project.model';
import { TimeSheetEntry } from './time-sheet-entry.model';

describe('time-sheet-field model shape', () => {
  it('Project.fields defaults to an empty array, not an object', () => {
    const project = new Project();
    expect(Array.isArray(project.fields)).toBe(true);
    expect(project.fields.length).toBe(0);
  });

  it('Project.categories defaults to an empty array and allowCustomCategory is true', () => {
    const project = new Project();
    expect(Array.isArray(project.categories)).toBe(true);
    expect(project.categories.length).toBe(0);
    expect(project.allowCustomCategory).toBe(true);
  });

  it('TimeSheetEntry.fieldValues defaults to an empty array, not an object', () => {
    const entry = new TimeSheetEntry();
    expect(Array.isArray(entry.fieldValues)).toBe(true);
    expect(entry.fieldValues.length).toBe(0);
  });

  it('clone() deep-copies fieldValues so mutating the clone does not affect the original', () => {
    const entry = new TimeSheetEntry();
    entry.fieldValues = [{ key: 'notes', value: 'original' }];

    const cloned = entry.clone();
    cloned.fieldValues[0].value = 'changed';

    expect(entry.fieldValues[0].value).toBe('original');
    expect(cloned.fieldValues).not.toBe(entry.fieldValues);
  });
});
