import { Project } from '@models';

import {
  buildProjectColorMap,
  getProjectColor,
  getStoredTimeSheetFilterProjectId,
  getThemeProjectColorOptions,
  getThemeProjectColorSlots,
  hashProjectId,
  pickNewProjectColor,
} from './time-sheet-project.util';

describe('time-sheet-project.util', () => {
  const filterKey = 'timeSheet.filterProjectId';
  const legacyKey = 'timeSheet.lastProjectId';

  afterEach(() => {
    localStorage.removeItem(filterKey);
    localStorage.removeItem(legacyKey);
  });

  it('migrates legacy filter project id from localStorage', () => {
    localStorage.setItem(legacyKey, 'project-legacy');
    expect(getStoredTimeSheetFilterProjectId()).toBe('project-legacy');
    expect(localStorage.getItem(filterKey)).toBe('project-legacy');
    expect(localStorage.getItem(legacyKey)).toBeNull();
  });

  function project(id: string): Project {
    const p = new Project();
    p.id = id;
    p.name = id;
    return p;
  }

  it('assigns a stable colour per project id', () => {
    const projects = [project('alpha'), project('beta'), project('gamma')];
    const first = buildProjectColorMap(projects);
    const second = buildProjectColorMap([...projects].reverse());

    for (const p of projects) {
      expect(first.get(p.id)).toBe(second.get(p.id));
    }
  });

  it('never assigns the same colour to two projects when slots allow', () => {
    const projects = Array.from({ length: 8 }, (_, i) => project(`project-${i}`));
    const colors = buildProjectColorMap(projects);
    const values = [...colors.values()];
    expect(new Set(values).size).toBe(values.length);
  });

  it('getProjectColor matches the built map', () => {
    const projects = [project('one'), project('two')];
    const map = buildProjectColorMap(projects);
    expect(getProjectColor('one', projects)).toBe(map.get('one')!);
    expect(getProjectColor('two', projects)).toBe(map.get('two')!);
  });

  it('uses a stored colour and keeps derived colours from clashing with it', () => {
    const stored = project('stored');
    stored.color = getThemeProjectColorSlots()[0];
    const projects = [stored, project('other')];
    const map = buildProjectColorMap(projects);

    expect(map.get('stored')).toBe(stored.color);
    expect(map.get('other')).not.toBe(stored.color);
  });

  it('pickNewProjectColor returns the first unused slot', () => {
    const slots = getThemeProjectColorSlots();
    const taken = project('taken');
    taken.color = slots[0];

    expect(pickNewProjectColor([], 'seed')).toBe(slots[0]);
    expect(pickNewProjectColor([taken], 'seed')).toBe(slots[1]);
  });

  it('pickNewProjectColor skips a colour derived for a project with no stored colour', () => {
    const slots = getThemeProjectColorSlots();
    let id = 'legacy';
    let n = 0;
    while (hashProjectId(id) % slots.length !== 0) {
      n += 1;
      id = `legacy-${n}`;
    }

    const legacy = project(id);
    expect(buildProjectColorMap([legacy]).get(legacy.id)).toBe(slots[0]);
    expect(pickNewProjectColor([legacy], 'seed')).toBe(slots[1]);
  });

  it('gives each palette slot a distinct accessible name', () => {
    const options = getThemeProjectColorOptions();
    const slots = getThemeProjectColorSlots();

    expect(options.map((option) => option.value)).toEqual(slots);
    expect(new Set(options.map((option) => option.label)).size).toBe(
      options.length,
    );
  });

  it('hashProjectId is deterministic', () => {
    expect(hashProjectId('proj-123')).toBe(hashProjectId('proj-123'));
    expect(hashProjectId('proj-123')).not.toBe(hashProjectId('proj-456'));
  });
});
