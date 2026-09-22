import { Project } from '@models';

import {
  buildProjectColorMap,
  getProjectColor,
  hashProjectId,
} from './time-sheet-project.util';

describe('time-sheet-project.util', () => {
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

  it('hashProjectId is deterministic', () => {
    expect(hashProjectId('proj-123')).toBe(hashProjectId('proj-123'));
    expect(hashProjectId('proj-123')).not.toBe(hashProjectId('proj-456'));
  });
});
