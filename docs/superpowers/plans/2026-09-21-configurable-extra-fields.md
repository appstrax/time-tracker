# TT-2: Configurable Extra Fields on Time Sheet Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the *mechanism* for per-project configurable extra fields on time sheet entries — model, project editor, capture modal, and every read path — without inventing any client-specific field name. The Louden/Ammcare field spec has not been supplied; this plan builds the generic capability so that populating it later is a config change, not an engineering change.

**Architecture:** A `ProjectField[]` array on `Project` (key/label/type/required/options) describes the configured fields for that project. A `TimeSheetFieldValue[]` array on `TimeSheetEntry` (key/value pairs, all values stored as strings) carries the captured values. The project editor lets an admin add/remove/reorder field descriptors. The capture modal derives its extra controls from `this.project.fields` (already resolved in the modal today) and reads/writes directly into `timeSheetEntry.fieldValues` by key — no new component inputs, no parallel local state. Every place that already renders a `TimeSheetEntry` (weekly tooltip, analytics details table, approval modal) grows a small section for configured values.

**Tech Stack:** Angular 21 standalone components, `@appstrax/services` (`Model`/`CrudService`/`ServiceHelper`), template-driven forms (`FormsModule`/`ngModel`), Jasmine/Karma.

**Spec:** Cadence ticket TT-2 ("Configurable extra fields on time sheet capture") — full description fetched via `mcp__cadence__get_ticket`. **The client field spec referenced in that ticket does not exist yet** (ticket subtask "Obtain the written Louden/Ammcare field spec" is unstarted, cut-off Tue 2026-09-22 EOD). This plan implements only the generic mechanism described in the ticket's "Scope" section, using the ticket's own *proposed* defaults for the three open gate decisions (see Global Constraints) — provisional, not a stakeholder-confirmed answer. No task in this plan references a Louden or Ammcare field name.

## Global Constraints

- **Branch base:** this branch (`tt-2-configurable-extra-fields`) is cut from `tt-1-home-time-entries-by-period`, not `dev` — TT-1 already relocated `filter-view-details` and the `unapproved-entries` modal to `src/app/components/time-sheet-analytics/filter-view-details/` and `src/app/modals/unapproved-entries/unapproved-entries.modal.*`. Task 4 edits those paths. If this plan is ever executed against a checkout where TT-1 hasn't merged and this branch wasn't cut from it, stop — the paths in Task 4 won't exist yet.
- **Gate ruling (a) — scoping:** per-project field sets (`Project.fields`), per the ticket's own proposal. Not global.
- **Gate ruling (b) — type vocabulary:** exactly `text | number | date | select | boolean`. Build nothing outside this list.
- **Gate ruling (c) — legacy strategy:** capture-forward. An entry that already had an `id` when the modal opened is exempt from configured-required-field validation (it can be re-saved incomplete); only genuinely new entries are blocked on missing required configured fields.
- **No invented field names.** Every field key/label/type used in this plan's code and tests is a placeholder for demonstrating the mechanism (e.g. `notes`, `client-ref`) — never a real Louden or Ammcare field name.
- **All `TimeSheetFieldValue.value` are stored as `string`**, regardless of the field's `type`. Booleans serialize as the literal strings `'true'`/`'false'`; numbers as their decimal string form; dates as `YYYY-MM-DD` (not full ISO) — see Task 1's hydration note for why this specific format matters.
- **No backend enforcement exists or is added.** `CrudService` writes straight to Appstrax with no schema validation; every check this plan adds is client-side only.
- **This plan does not touch `TimeSheetEntryModalOptions` / `TimeSheetDayComponent.openTimeSheetEntryModal()`'s `Object.assign(modalRef.componentInstance, options)` call** — field definitions come from `this.project.fields` (already resolved in the modal via the existing project lookup) and field values travel as part of `timeSheetEntry.fieldValues` (already part of the `timeSheetEntry` object passed through that same `Object.assign`). No new modal `@Input()` is needed for this ticket's scope.
- **This plan does not extend category to a controlled vocabulary, touch `AnalyticsFilter`, or touch the MCP server / Louden export.** Those are explicitly out of scope per the ticket ("only if the spec asks" / "feeds two other tickets, neither automatically") — see Task 5 for how that exclusion gets recorded rather than silently dropped.
- **Testing convention:** `ng test` in this repo must be invoked as `ng test --watch=false --browsers=ChromeHeadless` — bare `npm test` never terminates (karma config sets neither `browsers` nor `watch`). This is the project's real correctness gate alongside `ng build`; specs here use Jasmine/TestBed and are meaningful (unlike some other repos in this workspace) — write real assertions, not scaffolds.
- Commit after each task.

---

### Task 1: Field config and value models

**Files:**
- Create: `src/app/models/time-sheet-field.model.ts`
- Modify: `src/app/models/project.model.ts`
- Modify: `src/app/models/time-sheet-entry.model.ts`
- Modify: `src/app/models/index.ts`
- Test: `src/app/models/time-sheet-field.model.spec.ts`

**Interfaces:**
- Produces: `ProjectFieldType` (`'text' | 'number' | 'date' | 'select' | 'boolean'`), `ProjectField { key: string; label: string; type: ProjectFieldType; required: boolean; options: string[] }`, `TimeSheetFieldValue { key: string; value: string }` — all exported from `@models`. `Project.fields: ProjectField[]`. `TimeSheetEntry.fieldValues: TimeSheetFieldValue[]`. `TimeSheetEntry.clone()` deep-copies `fieldValues` (new array, new element objects), not just the outer object.
- Consumes: nothing from other tasks — this is the foundation every later task builds on.

**Context — read before writing code:** `@appstrax/services`' `ServiceHelper.fromDatabase` (in `node_modules/@appstrax/services/database/services/service-helper.js`) constructs `new this.type()` and then walks `Object.keys()` of *that fresh instance* to decide what to copy from the stored JSON. For a plain object property with no properties pre-declared (e.g. `fieldConfig: SomeConfig = {}`), `Object.keys({})` is empty, so nothing is ever copied in — it silently writes correctly and reads back empty forever. Arrays don't have this problem: they're routed to `parseArray`, which pushes each raw element through with no pre-declared shape required. That's why both `fields` and `fieldValues` **must** be typed as arrays with an initializer (`= []`), never as an object map.

The same helper's `parseArray` also has a footgun for `value`: for each array element that's a plain object, it self-assigns (`this.assign(val, val)`), and inside `assign`, any property whose *value* matches `/^(19|20)\d\d-(0[1-9]|1[012])-([012]\d|3[01])T([01]\d|2[0-3]):([0-5]\d):([0-5]\d).(\d+)Z$/` gets silently converted from a string to a `Date` object. A plain `YYYY-MM-DD` string (no `T`, no `Z`) does not match that regex and survives as a string — which is exactly why date-type field values must be stored as `YYYY-MM-DD`, not a full ISO datetime string.

- [ ] **Step 1: Write the model file**

Create `src/app/models/time-sheet-field.model.ts`:

```ts
export type ProjectFieldType = 'text' | 'number' | 'date' | 'select' | 'boolean';

export interface ProjectField {
  key: string;
  label: string;
  type: ProjectFieldType;
  required: boolean;
  options: string[];
}

export interface TimeSheetFieldValue {
  key: string;
  value: string;
}
```

- [ ] **Step 2: Write a test asserting the hydration-safe shape**

This is not a test of Angular component behavior — it's a regression guard on the exact data shape the rest of this ticket depends on, so a future refactor can't accidentally turn `fields`/`fieldValues` back into an object map and silently break hydration.

Create `src/app/models/time-sheet-field.model.spec.ts`:

```ts
import { Project } from './project.model';
import { TimeSheetEntry } from './time-sheet-entry.model';

describe('time-sheet-field model shape', () => {
  it('Project.fields defaults to an empty array, not an object', () => {
    const project = new Project();
    expect(Array.isArray(project.fields)).toBe(true);
    expect(project.fields.length).toBe(0);
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
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `ng test --watch=false --browsers=ChromeHeadless --include='**/time-sheet-field.model.spec.ts'`
Expected: FAIL — `project.fields`/`entry.fieldValues` don't exist yet (TypeScript compile error surfaced as a test failure), and `clone()` doesn't deep-copy `fieldValues` yet.

- [ ] **Step 4: Add `fields` to `Project`**

Modify `src/app/models/project.model.ts` — full new contents:

```ts
import { Model } from '@appstrax/services/shared/models/model';

import { User } from './user.model';
import { ProjectField } from './time-sheet-field.model';

export class Project extends Model {
  name: string = '';
  description: string = '';
  logoUrl: string = '';

  users: User[] = [];
  fields: ProjectField[] = [];
}
```

- [ ] **Step 5: Add `fieldValues` to `TimeSheetEntry` and fix `clone()`**

Modify `src/app/models/time-sheet-entry.model.ts` — full new contents:

```ts
import { Model } from '@appstrax/services/shared/models/model';

import { TimeSheetFieldValue } from './time-sheet-field.model';

export class TimeSheetEntry extends Model {
  public userId: string = '';
  public projectId: string = '';
  public date: Date = new Date();
  public hours: number = 0;
  public description: string = '';
  public category: string = '';
  public approved: boolean = false;
  public fieldValues: TimeSheetFieldValue[] = [];

  clone(): TimeSheetEntry {
    const entry = new TimeSheetEntry();
    Object.assign(entry, this);
    entry.fieldValues = this.fieldValues.map((fv) => ({ ...fv }));
    return entry;
  }
}
```

The `Object.assign(entry, this)` line still runs first (unchanged) — it copies `fieldValues` as the *same array reference* along with everything else. The new line immediately after replaces that shared reference with a fresh array of fresh objects, which is what makes the clone independent. Order matters: the replacement must come after `Object.assign`, not before.

- [ ] **Step 6: Export from the models barrel**

Modify `src/app/models/index.ts` — add one line (position doesn't matter, but keep it alongside the other model exports):

```ts
export * from './user.model';
export * from './project.model';
export * from './project-user.model';
export * from './time-sheet-entry.model';
export * from './analytics-filter.model';
export * from './time-sheet-field.model';
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `ng test --watch=false --browsers=ChromeHeadless --include='**/time-sheet-field.model.spec.ts'`
Expected: PASS (3 specs).

- [ ] **Step 8: Full build check**

Run: `ng build`
Expected: succeeds — this confirms nothing else in the codebase broke from the model change (there shouldn't be anything yet, since nothing else references `fields`/`fieldValues` until later tasks).

- [ ] **Step 9: Commit**

```bash
git add src/app/models/
git commit -m "Add ProjectField/TimeSheetFieldValue models and fix TimeSheetEntry.clone() to deep-copy fieldValues"
```

---

### Task 2: Project editor — configure fields per project

**Files:**
- Modify: `src/app/pages/project/project.page.ts`
- Modify: `src/app/pages/project/project.page.html`
- Modify: `src/app/pages/project/project.page.scss`

**Interfaces:**
- Consumes: `Project.fields: ProjectField[]`, `ProjectField`, `ProjectFieldType` from Task 1.
- Produces: nothing new consumed by later tasks — the capture modal (Task 3) reads `Project.fields` directly via the `Project` model itself, not via anything project-page-specific.

**Context:** `isFormValid()` already exists on `ProjectPage` (`project.page.ts:116`) but is **dead code today** — nothing calls it. `saveProject()` (`project.page.ts:58`) saves unconditionally. This task both extends `isFormValid()` for the new field-config checks *and* wires it into `saveProject()` for the first time, because "saving a project with a blank key... is blocked" (the acceptance criterion) is meaningless unless something actually calls the validator before saving.

- [ ] **Step 1: Add field-list state and a labeled type list**

In `project.page.ts`, add these imports:

```ts
import { Project, ProjectField, ProjectFieldType, ProjectUser, ProjectUserRole } from '@models';
```

(replacing the existing `import { Project, ProjectUser, ProjectUserRole } from '@models';` line).

Add this class field directly below `readonly projectUsersCount = computed(...)`:

```ts
  readonly fieldTypeOptions: { value: ProjectFieldType; label: string }[] = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Select' },
    { value: 'boolean', label: 'Yes/No' },
  ];
```

- [ ] **Step 2: Add add/remove/reorder/update methods**

Add these methods to `ProjectPage`, anywhere after `updateProjectDescription`:

```ts
  public addField(): void {
    this.updateProject((project) => {
      project.fields = [
        ...project.fields,
        { key: '', label: '', type: 'text', required: false, options: [] },
      ];
    });
  }

  public removeField(index: number): void {
    this.updateProject((project) => {
      project.fields = project.fields.filter((_, i) => i !== index);
    });
  }

  public moveFieldUp(index: number): void {
    if (index <= 0) return;
    this.updateProject((project) => {
      const fields = [...project.fields];
      [fields[index - 1], fields[index]] = [fields[index], fields[index - 1]];
      project.fields = fields;
    });
  }

  public moveFieldDown(index: number): void {
    this.updateProject((project) => {
      if (index >= project.fields.length - 1) return;
      const fields = [...project.fields];
      [fields[index], fields[index + 1]] = [fields[index + 1], fields[index]];
      project.fields = fields;
    });
  }

  public updateFieldKey(index: number, key: string): void {
    this.updateFieldAt(index, (field) => (field.key = key.trim()));
  }

  public updateFieldLabel(index: number, label: string): void {
    this.updateFieldAt(index, (field) => (field.label = label));
  }

  public updateFieldType(index: number, type: ProjectFieldType): void {
    this.updateFieldAt(index, (field) => {
      field.type = type;
      if (type !== 'select') {
        field.options = [];
      }
    });
  }

  public updateFieldRequired(index: number, required: boolean): void {
    this.updateFieldAt(index, (field) => (field.required = required));
  }

  public updateFieldOptionsText(index: number, optionsText: string): void {
    const options = optionsText
      .split(',')
      .map((option) => option.trim())
      .filter((option) => option.length > 0);
    this.updateFieldAt(index, (field) => (field.options = options));
  }

  public fieldOptionsText(field: ProjectField): string {
    return field.options.join(', ');
  }

  private updateFieldAt(index: number, updateFn: (field: ProjectField) => void): void {
    this.updateProject((project) => {
      const fields = project.fields.map((field, i) =>
        i === index ? { ...field } : field,
      );
      updateFn(fields[index]);
      project.fields = fields;
    });
  }
```

`updateFieldOptionsText` takes a comma-separated string (what a plain text input naturally produces) and turns it into `ProjectField.options: string[]`, trimming and dropping empty entries so `"a, b,, c"` becomes `['a', 'b', 'c']`.

- [ ] **Step 3: Extend `isFormValid()` and wire it into `saveProject()`**

Replace the existing `isFormValid()`:

```ts
  public isFormValid(): boolean {
    const project = this.project();
    return project.name != '' && project.description != '';
  }
```

with:

```ts
  public isFormValid(): boolean {
    const project = this.project();
    if (project.name == '' || project.description == '') {
      this.error.set('Project name and description are required');
      return false;
    }

    const seenKeys = new Set<string>();
    for (const field of project.fields) {
      if (!field.key.trim()) {
        this.error.set('Every custom field needs a key');
        return false;
      }
      if (seenKeys.has(field.key)) {
        this.error.set(`Duplicate field key: "${field.key}"`);
        return false;
      }
      seenKeys.add(field.key);

      if (field.type === 'select' && field.options.length === 0) {
        this.error.set(
          `Field "${field.key}" is a select field but has no options`,
        );
        return false;
      }
    }

    return true;
  }
```

Then in `saveProject()`, add the check as the very first line inside the `try` block:

```ts
  async saveProject(): Promise<void> {
    this.saving.set(true);
    this.error.set('');

    try {
      if (!this.isFormValid()) {
        return;
      }

      const logoFile = this.logoFile();
      if (logoFile) {
        await this.uploadProjectLogo(logoFile);
      }

      const project = await this.projectService.save(this.project());
      this.project.set(project);

      if (!this.editing()) {
        const user = this.store.user.user()!;
        const projectUser = new ProjectUser();
        projectUser.projectId = project.id;
        projectUser.userId = user.id;
        projectUser.role = ProjectUserRole.ADMIN;
        await this.projectUserService.save(projectUser);
      }

      await this.refreshProjectsStore();
      this.toast.success('Project saved successfully', 'Success');
      this.router.navigate(['/projects']);
    } catch (error: any) {
      this.error.set(error.message);
      this.toast.error(error.message || 'Failed to save project', 'Error');
    } finally {
      this.saving.set(false);
    }
  }
```

Only the new `if (!this.isFormValid()) { return; }` block (right after the `try {`) is added — every other line is identical to the method's current content, reproduced here in full so there's no ambiguity about where the new check goes. Note `isFormValid()` now sets `this.error` itself via `.set(...)`, so don't clear it again after calling it, and the early `return` inside `try` still runs the `finally` block, which correctly resets `this.saving` back to `false`.

- [ ] **Step 4: Render the field editor in the template**

In `project.page.html`, add a new card after the closing `</section>` of `editor-card`'s sibling `preview-card` (i.e. as a new top-level child of `.project-content-grid`'s parent, right after the `</div>` that closes `project-content-grid`, and before the `@if (editing() && project().id) { <app-project-users ...` block):

```html
    <section class="editor-card fields-card">
      <div class="card-header">
        <div>
          <p class="eyebrow">Capture</p>
          <h2>Custom fields</h2>
          <p>
            Extra fields that appear on this project's time sheet capture
            form. Leave empty for the standard four-field form.
          </p>
        </div>
        <button type="button" class="btn btn-outline-secondary" (click)="addField()">
          <i class="bi bi-plus-lg me-2"></i>
          Add field
        </button>
      </div>

      @if (!project().fields.length) {
        <p class="text-muted mb-0">No custom fields configured.</p>
      } @else {
        <div class="field-rows">
          @for (field of project().fields; track $index) {
            <div class="field-row">
              <div class="field-row-inputs">
                <div class="form-group">
                  <label>Key</label>
                  <input
                    type="text"
                    class="form-control"
                    [ngModel]="field.key"
                    (ngModelChange)="updateFieldKey($index, $event)"
                    name="fieldKey{{ $index }}"
                    placeholder="e.g. client-ref"
                  />
                </div>
                <div class="form-group">
                  <label>Label</label>
                  <input
                    type="text"
                    class="form-control"
                    [ngModel]="field.label"
                    (ngModelChange)="updateFieldLabel($index, $event)"
                    name="fieldLabel{{ $index }}"
                    placeholder="Shown to the user"
                  />
                </div>
                <div class="form-group">
                  <label>Type</label>
                  <select
                    class="form-select"
                    [ngModel]="field.type"
                    (ngModelChange)="updateFieldType($index, $event)"
                    name="fieldType{{ $index }}"
                  >
                    @for (option of fieldTypeOptions; track option.value) {
                      <option [value]="option.value">{{ option.label }}</option>
                    }
                  </select>
                </div>
                @if (field.type === 'select') {
                  <div class="form-group">
                    <label>Options (comma-separated)</label>
                    <input
                      type="text"
                      class="form-control"
                      [ngModel]="fieldOptionsText(field)"
                      (ngModelChange)="updateFieldOptionsText($index, $event)"
                      name="fieldOptions{{ $index }}"
                      placeholder="e.g. Draft, Final"
                    />
                  </div>
                }
                <div class="form-check field-required-check">
                  <input
                    type="checkbox"
                    class="form-check-input"
                    id="fieldRequired{{ $index }}"
                    [ngModel]="field.required"
                    (ngModelChange)="updateFieldRequired($index, $event)"
                    name="fieldRequired{{ $index }}"
                  />
                  <label class="form-check-label" for="fieldRequired{{ $index }}">Required</label>
                </div>
              </div>
              <div class="field-row-actions">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary"
                  [disabled]="$index === 0"
                  (click)="moveFieldUp($index)"
                  aria-label="Move field up"
                >
                  <i class="bi bi-arrow-up"></i>
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary"
                  [disabled]="$index === project().fields.length - 1"
                  (click)="moveFieldDown($index)"
                  aria-label="Move field down"
                >
                  <i class="bi bi-arrow-down"></i>
                </button>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-danger"
                  (click)="removeField($index)"
                  aria-label="Remove field"
                >
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </section>
```

This card is admin-only in effect because the whole `/projects/project` route is `AdminGuard`-gated (`app.routes.ts`) — no separate role check is needed inside the page itself, matching how the rest of this page already behaves.

- [ ] **Step 5: Add minimal styles for the new rows**

Append to `project.page.scss`, inside the `.project-page { ... }` block (anywhere after the existing rules, before the final closing brace):

```scss
  .fields-card {
    padding: 1.75rem;
  }

  .field-rows {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .field-row {
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid var(--color-border);
    border-radius: 16px;
  }

  .field-row-inputs {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.75rem;
    align-items: end;
  }

  .field-required-check {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding-bottom: 0.5rem;
  }

  .field-row-actions {
    display: flex;
    gap: 0.4rem;
    flex-shrink: 0;
  }
```

- [ ] **Step 6: Build check**

Run: `ng build`
Expected: succeeds.

- [ ] **Step 7: Manual verification**

```bash
ng serve
```

In the browser, as an admin: open an existing project's edit page (or create one), click "Add field" a few times, set a key/label/type on each, mark one required, add a `select` field with no options and try to save — confirm the save is blocked with an error naming the missing options. Fill in options and save; reload the page and confirm the field rows are still there with the same values (this is the "survives a full page reload" acceptance criterion — it round-trips through `ProjectService.save`/`findById`, i.e. through Appstrax, not just the in-memory signal).

- [ ] **Step 8: Commit**

```bash
git add src/app/pages/project/
git commit -m "Add per-project custom field editor (add/remove/reorder/validate)"
```

---

### Task 3: Capture modal — render, preserve, and validate configured fields

**Files:**
- Modify: `src/app/modals/time-sheet-entry/time-sheet-entry.modal.ts`
- Modify: `src/app/modals/time-sheet-entry/time-sheet-entry.modal.html`
- Modify: `src/app/modals/time-sheet-entry/time-sheet-entry.modal.spec.ts`

**Interfaces:**
- Consumes: `Project.fields`, `ProjectField`, `ProjectFieldType`, `TimeSheetFieldValue` from Task 1. `this.project: Project | undefined` and `this.timeSheetEntry: TimeSheetEntry` (both already exist on `TimeSheetEntryModal`).
- Produces: nothing new consumed by later tasks — Task 4's read paths consume `TimeSheetEntry.fieldValues` directly (from Task 1), not anything modal-specific.

**Context — the existing spec has one test that is currently broken, unrelated to this ticket, and you must fix it as part of this task** (it stands in the way of the "`ng test` passes" acceptance criterion). `onProjectSelected` used to write the selected project id to `localStorage` immediately on selection; that was fixed in a prior change so `localStorage` is only written on **save**, closing a bug where merely browsing projects in the modal silently changed state elsewhere in the app. The test `'should store the selected project id'` (`time-sheet-entry.modal.spec.ts:84-91`) still asserts the old (buggy) behavior and currently fails. Step 7 below rewrites it to assert the current, correct behavior.

- [ ] **Step 1: Add field-value read/write helpers**

In `time-sheet-entry.modal.ts`, add this import (extend the existing `@models` import):

```ts
import { Project, TimeSheetEntry, ProjectField } from '@models';
```

(replacing `import { Project, TimeSheetEntry } from '@models';`).

Add this class field directly below `errorMessage: string = '';`:

```ts
  wasExistingEntryOnOpen: boolean = false;
```

Add these methods anywhere after `onProjectSelected`:

```ts
  get projectFields(): ProjectField[] {
    return this.project?.fields ?? [];
  }

  getFieldValue(key: string): string {
    return (
      this.timeSheetEntry.fieldValues.find((fv) => fv.key === key)?.value ?? ''
    );
  }

  setFieldValue(key: string, value: string): void {
    const existing = this.timeSheetEntry.fieldValues.find(
      (fv) => fv.key === key,
    );
    if (existing) {
      existing.value = value;
    } else {
      this.timeSheetEntry.fieldValues = [
        ...this.timeSheetEntry.fieldValues,
        { key, value },
      ];
    }
  }

  isFieldBoolean(field: ProjectField): boolean {
    return this.getFieldValue(field.key) === 'true';
  }

  setFieldBoolean(key: string, checked: boolean): void {
    this.setFieldValue(key, checked ? 'true' : 'false');
  }
```

Values are deliberately never cleared on project switch — `timeSheetEntry.fieldValues` just accumulates entries for whatever keys have been touched. Switching to a project whose fields don't include a previously-touched key simply means that key isn't rendered right now (`projectFields` won't include it), not that the value is gone — switching back restores it because the value is still sitting in the array. Step 6 prunes leftover keys at save time so nothing stale from an earlier project selection gets persisted.

- [ ] **Step 2: Record whether this was an existing entry, at the top of `ngOnInit`**

In `ngOnInit`, the very first line of the method body currently is:

```ts
  async ngOnInit(): Promise<void> {
    const projectId =
      this.timeSheetEntry.projectId || getStoredTimeSheetProjectId();
```

Add one line before it:

```ts
  async ngOnInit(): Promise<void> {
    this.wasExistingEntryOnOpen = !!this.timeSheetEntry.id;

    const projectId =
      this.timeSheetEntry.projectId || getStoredTimeSheetProjectId();
```

This must run before anything else touches `timeSheetEntry`, so it reflects the entry's state exactly as the modal received it (an entry opened via "edit an existing row" has an `id` already; a brand-new entry from `new TimeSheetEntry()` does not).

- [ ] **Step 3: Extend `isFormValid()` for configured-required fields**

The existing method:

```ts
  isFormValid(): boolean {
    let isValid =
      this.timeSheetEntry.projectId &&
      this.timeSheetEntry.hours &&
      this.timeSheetEntry.description &&
      this.timeSheetEntry.category;

    if (isValid) return true;
    let errorMessage = 'Please fill in all required fields';
    if (!this.timeSheetEntry.projectId)
      errorMessage += '\n\t• Please select a project';
    if (!this.timeSheetEntry.category)
      errorMessage += '\n\t• Category is required';
    if (!this.timeSheetEntry.hours)
      errorMessage += '\n\t• Hours must be greater than 0';
    if (!this.timeSheetEntry.description)
      errorMessage += '\n\t• Description is required';
    this.errorMessage = errorMessage;
    return false;
  }
```

becomes:

```ts
  isFormValid(): boolean {
    const missingFields = this.wasExistingEntryOnOpen
      ? []
      : this.projectFields.filter(
          (field) => field.required && !this.getFieldValue(field.key).trim(),
        );

    let isValid =
      this.timeSheetEntry.projectId &&
      this.timeSheetEntry.hours &&
      this.timeSheetEntry.description &&
      this.timeSheetEntry.category &&
      missingFields.length === 0;

    if (isValid) return true;
    let errorMessage = 'Please fill in all required fields';
    if (!this.timeSheetEntry.projectId)
      errorMessage += '\n\t• Please select a project';
    if (!this.timeSheetEntry.category)
      errorMessage += '\n\t• Category is required';
    if (!this.timeSheetEntry.hours)
      errorMessage += '\n\t• Hours must be greater than 0';
    if (!this.timeSheetEntry.description)
      errorMessage += '\n\t• Description is required';
    for (const field of missingFields) {
      errorMessage += `\n\t• ${field.label || field.key} is required`;
    }
    this.errorMessage = errorMessage;
    return false;
  }
```

`missingFields` is computed as `[]` outright for a pre-existing entry (`wasExistingEntryOnOpen`), which is the capture-forward exemption — the loop that appends to `errorMessage` naturally does nothing when the list is empty, so no other branch needs an `if` guard for it.

- [ ] **Step 4: Prune stale field values and store the project id on save**

The existing `onSaveTimeSheetEntry`:

```ts
  onSaveTimeSheetEntry(): void {
    this.errorMessage = '';
    try {
      if (!this.isFormValid()) return;

      if (!this.timeSheetEntry) {
        this.errorMessage = 'Invalid time sheet entry';
        return;
      }

      storeTimeSheetProjectId(this.timeSheetEntry.projectId);
      this.activeModal.close({
        action: 'save',
        timeSheetEntry: this.timeSheetEntry,
      });
    } catch (error) {
      this.errorMessage = 'Error saving time sheet entry';
    }
  }
```

becomes (one new line, right before `storeTimeSheetProjectId`):

```ts
  onSaveTimeSheetEntry(): void {
    this.errorMessage = '';
    try {
      if (!this.isFormValid()) return;

      if (!this.timeSheetEntry) {
        this.errorMessage = 'Invalid time sheet entry';
        return;
      }

      this.pruneStaleFieldValues();
      storeTimeSheetProjectId(this.timeSheetEntry.projectId);
      this.activeModal.close({
        action: 'save',
        timeSheetEntry: this.timeSheetEntry,
      });
    } catch (error) {
      this.errorMessage = 'Error saving time sheet entry';
    }
  }
```

Add the new private method anywhere after `onSaveTimeSheetEntry`:

```ts
  private pruneStaleFieldValues(): void {
    const currentKeys = new Set(this.projectFields.map((field) => field.key));
    this.timeSheetEntry.fieldValues = this.timeSheetEntry.fieldValues.filter(
      (fv) => currentKeys.has(fv.key),
    );
  }
```

This drops any value whose key isn't in the *currently selected* project's field set right before saving — so switching from Project A to Project B and saving under B never persists a leftover value keyed to one of A's fields.

- [ ] **Step 5: Render the configured fields in the template**

In `time-sheet-entry.modal.html`, add a new block right after the existing description `form-group` and before the `@if (errorMessage) { ... }` block:

```html
    @if (projectFields.length) {
      <div class="custom-fields-section">
        @for (field of projectFields; track field.key) {
          <div class="form-group">
            <label [for]="'field-' + field.key">
              {{ field.required ? '* ' : '' }}{{ field.label || field.key }}
            </label>

            @switch (field.type) {
              @case ('text') {
                <input
                  type="text"
                  class="form-control"
                  [id]="'field-' + field.key"
                  [ngModel]="getFieldValue(field.key)"
                  (ngModelChange)="setFieldValue(field.key, $event)"
                  [disabled]="timeSheetEntry.approved"
                  [required]="field.required"
                />
              }
              @case ('number') {
                <input
                  type="number"
                  class="form-control"
                  [id]="'field-' + field.key"
                  [ngModel]="getFieldValue(field.key)"
                  (ngModelChange)="setFieldValue(field.key, $event + '')"
                  [disabled]="timeSheetEntry.approved"
                  [required]="field.required"
                />
              }
              @case ('date') {
                <input
                  type="date"
                  class="form-control"
                  [id]="'field-' + field.key"
                  [ngModel]="getFieldValue(field.key)"
                  (ngModelChange)="setFieldValue(field.key, $event)"
                  [disabled]="timeSheetEntry.approved"
                  [required]="field.required"
                />
              }
              @case ('select') {
                <select
                  class="form-select"
                  [id]="'field-' + field.key"
                  [ngModel]="getFieldValue(field.key)"
                  (ngModelChange)="setFieldValue(field.key, $event)"
                  [disabled]="timeSheetEntry.approved"
                  [required]="field.required"
                >
                  <option value="">Select...</option>
                  @for (option of field.options; track option) {
                    <option [value]="option">{{ option }}</option>
                  }
                </select>
              }
              @case ('boolean') {
                <div class="form-check">
                  <input
                    type="checkbox"
                    class="form-check-input"
                    [id]="'field-' + field.key"
                    [ngModel]="isFieldBoolean(field)"
                    (ngModelChange)="setFieldBoolean(field.key, $event)"
                    [disabled]="timeSheetEntry.approved"
                  />
                </div>
              }
            }
          </div>
        }
      </div>
    }
```

The HTML `<input type="date">` element natively produces and accepts `YYYY-MM-DD` in its `value`, so `setFieldValue(field.key, $event)` for the date case already stores the correct hydration-safe format with no extra formatting code.

- [ ] **Step 6: Add a class for the new section to the modal's stylesheet**

Append to `time-sheet-entry.modal.scss` (create the rule at the end of the file, whatever else is there stays untouched):

```scss
.custom-fields-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}
```

- [ ] **Step 7: Fix the pre-existing broken spec and add new coverage**

Replace the full contents of `time-sheet-entry.modal.spec.ts`:

```ts
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { appstraxAuth } from '@appstrax/services/auth';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { Project } from '@models';
import { Store } from '@state';
import { TimeSheetDisplayUtil } from '@utils';

import { TimeSheetEntryModal } from './time-sheet-entry.modal';

describe('TimeSheetEntryComponent', () => {
  const storageKey = 'timeSheet.lastProjectId';
  const project = {
    id: 'project-1',
    name: 'Alpha',
    fields: [],
  } as Project;

  const projectWithFields = {
    id: 'project-2',
    name: 'Beta',
    fields: [
      { key: 'notes', label: 'Notes', type: 'text', required: true, options: [] },
      { key: 'optional-tag', label: 'Tag', type: 'text', required: false, options: [] },
    ],
  } as Project;

  let component: TimeSheetEntryModal;
  let fixture: ComponentFixture<TimeSheetEntryModal>;
  let activeModal: jasmine.SpyObj<NgbActiveModal>;
  let displayUtil: jasmine.SpyObj<TimeSheetDisplayUtil>;

  beforeEach(async () => {
    spyOn(appstraxAuth, 'getUser').and.resolveTo({ id: 'test-user' } as any);
    activeModal = jasmine.createSpyObj<NgbActiveModal>('NgbActiveModal', [
      'close',
      'dismiss',
    ]);
    displayUtil = jasmine.createSpyObj<TimeSheetDisplayUtil>(
      'TimeSheetDisplayUtil',
      ['formatHours'],
    );
    displayUtil.formatHours.and.returnValue('0h 00m');

    await TestBed.configureTestingModule({
      imports: [TimeSheetEntryModal],
      providers: [
        provideZonelessChangeDetection(),
        { provide: NgbActiveModal, useValue: activeModal },
        {
          provide: Store,
          useValue: {
            projects: {
              projects: signal([project, projectWithFields]),
            },
          },
        },
        {
          provide: TimeSheetDisplayUtil,
          useValue: displayUtil,
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.removeItem(storageKey);
  });

  async function createComponent(): Promise<void> {
    fixture = TestBed.createComponent(TimeSheetEntryModal);
    component = fixture.componentInstance;
    component.categories = [];
    component.date = new Date();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function fillRequiredBaseFields(): void {
    component.timeSheetEntry.hours = 1;
    component.timeSheetEntry.description = 'did work';
    component.timeSheetEntry.category = 'General';
  }

  it('should create', async () => {
    await createComponent();
    expect(component).toBeTruthy();
  });

  it('should preselect the last stored project for a new entry', async () => {
    localStorage.setItem(storageKey, project.id);

    await createComponent();

    expect(component.project?.id).toBe(project.id);
    expect(component.timeSheetEntry.projectId).toBe(project.id);
  });

  it('should not write to storage merely by selecting a project', async () => {
    await createComponent();

    component.onProjectSelected(project);

    expect(component.timeSheetEntry.projectId).toBe(project.id);
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('should store the selected project id only on save', async () => {
    await createComponent();

    component.onProjectSelected(project);
    fillRequiredBaseFields();
    component.onSaveTimeSheetEntry();

    expect(localStorage.getItem(storageKey)).toBe(project.id);
    expect(activeModal.close).toHaveBeenCalledWith(
      jasmine.objectContaining({ action: 'save' }),
    );
  });

  it('should expose no configured fields for a project with none', async () => {
    await createComponent();
    component.onProjectSelected(project);

    expect(component.projectFields).toEqual([]);
  });

  it('should expose the selected project\'s configured fields', async () => {
    await createComponent();
    component.onProjectSelected(projectWithFields);

    expect(component.projectFields.map((f) => f.key)).toEqual([
      'notes',
      'optional-tag',
    ]);
  });

  it('should block saving a new entry when a required configured field is empty', async () => {
    await createComponent();
    component.onProjectSelected(projectWithFields);
    fillRequiredBaseFields();

    const isValid = component.isFormValid();

    expect(isValid).toBe(false);
    expect(component.errorMessage).toContain('Notes is required');
  });

  it('should allow saving once the required configured field is filled', async () => {
    await createComponent();
    component.onProjectSelected(projectWithFields);
    fillRequiredBaseFields();
    component.setFieldValue('notes', 'some notes');

    expect(component.isFormValid()).toBe(true);
  });

  it('should preserve a typed field value when switching project and back', async () => {
    await createComponent();
    component.onProjectSelected(projectWithFields);
    component.setFieldValue('notes', 'kept across switches');

    component.onProjectSelected(project);
    component.onProjectSelected(projectWithFields);

    expect(component.getFieldValue('notes')).toBe('kept across switches');
  });

  it('should drop values for fields outside the currently selected project on save', async () => {
    await createComponent();
    component.onProjectSelected(projectWithFields);
    component.setFieldValue('notes', 'a note');
    component.setFieldValue('leftover-from-elsewhere', 'stale');
    fillRequiredBaseFields();

    component.onSaveTimeSheetEntry();

    const keys = component.timeSheetEntry.fieldValues.map((fv) => fv.key);
    expect(keys).toEqual(['notes']);
  });

  it('should skip required-configured-field validation for a pre-existing entry (capture-forward)', async () => {
    await createComponent();
    component.timeSheetEntry.id = 'existing-entry-id';
    component.wasExistingEntryOnOpen = true;
    component.onProjectSelected(projectWithFields);
    fillRequiredBaseFields();
    // 'notes' (required) deliberately left blank.

    expect(component.isFormValid()).toBe(true);
  });
});
```

- [ ] **Step 8: Run the full spec file**

Run: `ng test --watch=false --browsers=ChromeHeadless --include='**/time-sheet-entry.modal.spec.ts'`
Expected: PASS — all specs green, including the two that were failing/broken before this task (`'should create'` was already passing; `'should store the selected project id'` is replaced by the two specs that assert the correct on-save-only behavior).

- [ ] **Step 9: Build check**

Run: `ng build`
Expected: succeeds.

- [ ] **Step 10: Manual verification**

```bash
ng serve
```

As any user: open the time sheet, click a day to add an entry, pick a project with configured fields (from Task 2's testing), confirm the extra controls render below Description with the right input types, confirm a required one blocks save when empty, fill it and save, reopen the same entry and confirm the value is still there. Switch the project dropdown inside the modal to a different project and back — confirm the first project's typed values reappear. Pick a project with no configured fields — confirm the modal looks exactly as it did before this ticket.

- [ ] **Step 11: Commit**

```bash
git add src/app/modals/time-sheet-entry/
git commit -m "Render, validate, and persist configured field values in the capture modal"
```

---

### Task 4: Render configured values in the three read paths

**Files:**
- Modify: `src/app/pages/time-sheets/time-sheet/components/time-sheet-number-line/time-sheet-number-line.component.ts`
- Modify: `src/app/components/time-sheet-analytics/filter-view-details/filter-view-details.component.html`
- Modify: `src/app/modals/unapproved-entries/unapproved-entries.modal.html`
- Test: `src/app/pages/time-sheets/time-sheet/components/time-sheet-number-line/time-sheet-number-line.component.spec.ts`

**Interfaces:**
- Consumes: `TimeSheetEntry.fieldValues`, `TimeSheetFieldValue`, `Project.fields`, `ProjectField` from Task 1. No interfaces from Task 2 or 3 are needed — this task only reads data those tasks write.

**Context:** `time-sheet-number-line.component.ts`'s `getTooltipContent()` builds an HTML string via template literal and hands it to Bootstrap's `Tooltip` with `html: true` — and today it does this **without escaping any of the interpolated values** (project name, category, description). That's a pre-existing stored-XSS-shaped gap in code this task already has to touch to add configured-field values, so this task closes it for every field in that function, not just the new ones — leaving the existing fields unescaped while escaping only the new ones would be a strange half-fix once you're already inside the function.

- [ ] **Step 1: Write a failing test for HTML-escaped tooltip content**

There's no existing spec file for this component. Create `src/app/pages/time-sheets/time-sheet/components/time-sheet-number-line/time-sheet-number-line.component.spec.ts`:

```ts
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Project, TimeSheetEntry } from '@models';

import { TimeSheetNumberLineComponent } from './time-sheet-number-line.component';

describe('TimeSheetNumberLineComponent', () => {
  let component: TimeSheetNumberLineComponent;
  let fixture: ComponentFixture<TimeSheetNumberLineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeSheetNumberLineComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeSheetNumberLineComponent);
    component = fixture.componentInstance;
  });

  function makeEntry(overrides: Partial<TimeSheetEntry> = {}): TimeSheetEntry {
    const entry = new TimeSheetEntry();
    entry.projectId = 'project-1';
    entry.hours = 1;
    entry.category = 'General';
    entry.description = 'desc';
    Object.assign(entry, overrides);
    return entry;
  }

  it('escapes HTML in the description when building tooltip content', () => {
    const entry = makeEntry({
      description: '<img src=x onerror=alert(1)>',
    });

    const html = (component as any).getTooltipContent(entry, undefined);

    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('escapes HTML in a configured field value', () => {
    const project = new Project();
    project.id = 'project-1';
    project.fields = [
      { key: 'notes', label: 'Notes', type: 'text', required: false, options: [] },
    ];
    const entry = makeEntry({
      fieldValues: [{ key: 'notes', value: '<b>bold</b>' }],
    });

    const html = (component as any).getTooltipContent(entry, project);

    expect(html).toContain('&lt;b&gt;bold&lt;/b&gt;');
    expect(html).toContain('Notes');
  });

  it('omits the configured-fields block entirely when the entry has no field values', () => {
    const project = new Project();
    project.id = 'project-1';
    project.fields = [
      { key: 'notes', label: 'Notes', type: 'text', required: false, options: [] },
    ];
    const entry = makeEntry();

    const html = (component as any).getTooltipContent(entry, project);

    expect(html).not.toContain('Notes');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `ng test --watch=false --browsers=ChromeHeadless --include='**/time-sheet-number-line.component.spec.ts'`
Expected: FAIL — `getTooltipContent` doesn't escape yet and doesn't render configured fields yet.

- [ ] **Step 3: Add an escaping helper and render configured fields**

In `time-sheet-number-line.component.ts`, add this private method anywhere in the class (e.g. directly above `getTooltipContent`):

```ts
  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
```

Replace `getTooltipContent`:

```ts
  private getTooltipContent(entry: TimeSheetEntry, project?: Project): string {
    const hours = Math.floor(entry.hours);
    const minutes = (entry.hours - hours) * 60;
    return `
      <div class="p-2">
        <div class="mb-2"><strong>Project:</strong><br> ${project?.name || 'N/A'}</div>
        <div class="mb-2"><strong>Category:</strong><br> ${entry.category || 'N/A'}</div>
        <div class="mb-2"><strong>Hours:</strong><br> ${hours}h ${minutes}m</div>
        <div><strong>Description:</strong><br> ${entry.description || 'N/A'}</div>
      </div>
    `;
  }
```

with:

```ts
  private getTooltipContent(entry: TimeSheetEntry, project?: Project): string {
    const hours = Math.floor(entry.hours);
    const minutes = (entry.hours - hours) * 60;
    return `
      <div class="p-2">
        <div class="mb-2"><strong>Project:</strong><br> ${this.escapeHtml(project?.name || 'N/A')}</div>
        <div class="mb-2"><strong>Category:</strong><br> ${this.escapeHtml(entry.category || 'N/A')}</div>
        <div class="mb-2"><strong>Hours:</strong><br> ${hours}h ${minutes}m</div>
        <div><strong>Description:</strong><br> ${this.escapeHtml(entry.description || 'N/A')}</div>
        ${this.getFieldValuesHtml(entry, project)}
      </div>
    `;
  }

  private getFieldValuesHtml(entry: TimeSheetEntry, project?: Project): string {
    const fields = project?.fields ?? [];
    const rows = fields
      .map((field) => {
        const value = entry.fieldValues.find((fv) => fv.key === field.key)?.value;
        if (!value) return '';
        return `<div class="mb-2"><strong>${this.escapeHtml(field.label || field.key)}:</strong><br> ${this.escapeHtml(value)}</div>`;
      })
      .filter((row) => row.length > 0);

    return rows.join('');
  }
```

`getFieldValuesHtml` skips any configured field with no captured value, so an entry with no `fieldValues` (every entry created before this ticket, and any entry on a project with no configured fields) renders a tooltip byte-for-byte identical to before.

- [ ] **Step 4: Run the test to verify it passes**

Run: `ng test --watch=false --browsers=ChromeHeadless --include='**/time-sheet-number-line.component.spec.ts'`
Expected: PASS (3 specs).

- [ ] **Step 5: Add configured values to the analytics details table**

In `filter-view-details.component.html`, the table currently has four columns (`Project`, `Hours`, `Category`, `Status`). This component only ever shows a single, page-wide table — not one column set per project — and different entries in the same table may belong to projects with different configured fields, or none. Rather than adding fixed extra `<th>` columns (which would be empty/misleading for entries whose project has no matching field), render configured values as inline pills inside the existing row, appended after the Category cell.

Change the `<thead>` from:

```html
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Hours</th>
                  <th>Category</th>
                  <th>Status</th>
                </tr>
              </thead>
```

to:

```html
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Hours</th>
                  <th>Category</th>
                  <th>Details</th>
                  <th>Status</th>
                </tr>
              </thead>
```

And change the row body from:

```html
                @for (entry of dateGroup.entries; track entry) {
                  <tr>
                    <td>
                      <span class="project-pill">
                        {{ displayUtils.getProjectName(entry.projectId, projects()) }}
                      </span>
                    </td>
                    <td class="hours">{{ displayUtils.formatHours(entry.hours) }}</td>
                    <td>
                      <span class="category-pill">{{ entry.category }}</span>
                    </td>
                    <td>
                      <span class="status-pill" [class.pending]="!entry.approved">
                        {{ entry.approved ? 'Approved' : 'Pending' }}
                      </span>
                    </td>
                  </tr>
                }
```

to:

```html
                @for (entry of dateGroup.entries; track entry) {
                  <tr>
                    <td>
                      <span class="project-pill">
                        {{ displayUtils.getProjectName(entry.projectId, projects()) }}
                      </span>
                    </td>
                    <td class="hours">{{ displayUtils.formatHours(entry.hours) }}</td>
                    <td>
                      <span class="category-pill">{{ entry.category }}</span>
                    </td>
                    <td>
                      @if (entry.fieldValues.length) {
                        <div class="field-value-pills">
                          @for (fieldValue of entry.fieldValues; track fieldValue.key) {
                            @if (fieldValue.value) {
                              <span class="field-value-pill">{{ fieldValue.key }}: {{ fieldValue.value }}</span>
                            }
                          }
                        </div>
                      } @else {
                        <span class="text-muted">—</span>
                      }
                    </td>
                    <td>
                      <span class="status-pill" [class.pending]="!entry.approved">
                        {{ entry.approved ? 'Approved' : 'Pending' }}
                      </span>
                    </td>
                  </tr>
                }
```

This renders `fieldValue.key`, not the field's configured `label` — this component only receives `entries()` and `projects()` as inputs (no per-entry project lookup for field *definitions*, only `displayUtils.getProjectName` for the name), and adding a full field-definition lookup here for a label would mean threading `ProjectField[]` through a component whose whole job is "list entries," not "know about field config." The key is legible enough for this dense summary table; showing the friendly label is what the capture modal and the tooltip are for. All bindings here use `{{ }}` interpolation, which Angular auto-escapes — no manual escaping needed in this file (only the manually-constructed HTML string in Task 4 Step 3 needed it).

- [ ] **Step 6: Add minimal styling for the pills**

Check `filter-view-details.component.scss` for the existing `.category-pill`/`.project-pill`/`.status-pill` rules and add a sibling rule near them:

```scss
.field-value-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.field-value-pill {
  display: inline-flex;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-border) 60%, transparent);
  font-size: 0.8rem;
  white-space: nowrap;
}
```

- [ ] **Step 7: Add configured values to the approval modal**

In `unapproved-entries.modal.html`, the entries table has five columns (`Project`, `Hours`, `Category`, `Description`, `Status`). Add a `Details` column the same way, between `Description` and `Status`.

Change the `<thead>` from:

```html
          <thead>
            <tr>
              <th>Project</th>
              <th>Hours</th>
              <th>Category</th>
              <th>Description</th>
              <th>Status</th>
            </tr>
          </thead>
```

to:

```html
          <thead>
            <tr>
              <th>Project</th>
              <th>Hours</th>
              <th>Category</th>
              <th>Description</th>
              <th>Details</th>
              <th>Status</th>
            </tr>
          </thead>
```

And insert a new `<td>` in the row body, between the Description `<td>` and the Status `<td>`:

```html
                <td>
                  <span class="description" [title]="entry.description">
                    {{ entry.description }}
                  </span>
                </td>
                <td>
                  @if (entry.fieldValues.length) {
                    <div class="field-value-pills">
                      @for (fieldValue of entry.fieldValues; track fieldValue.key) {
                        @if (fieldValue.value) {
                          <span class="field-value-pill">{{ fieldValue.key }}: {{ fieldValue.value }}</span>
                        }
                      }
                    </div>
                  } @else {
                    <span class="text-muted">—</span>
                  }
                </td>
                <td>
                  <span class="status-pill" [class.pending]="!entry.approved">
                    {{ entry.approved ? 'Approved' : 'Pending' }}
                  </span>
                </td>
```

Add the same two SCSS rules from Step 6 to `unapproved-entries.modal.scss` (this file doesn't share a stylesheet with `filter-view-details`, so the rule needs to exist in both places):

```scss
.field-value-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.field-value-pill {
  display: inline-flex;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-border) 60%, transparent);
  font-size: 0.8rem;
  white-space: nowrap;
}
```

- [ ] **Step 8: Build and full-suite check**

Run: `ng build`
Run: `ng test --watch=false --browsers=ChromeHeadless`
Expected: both succeed, no new failures anywhere in the suite (not just the files touched this task).

- [ ] **Step 9: Manual verification**

```bash
ng serve
```

As an admin: on the weekly time sheet, hover a logged entry that has configured field values (from Task 3's manual testing) — confirm the tooltip shows the field values, and hover an entry with none — confirm the tooltip is unchanged from before this ticket. On `/analytics`, switch to the Details view and confirm the new Details column shows the pills for entries that have values, and an em-dash for ones that don't. Open the Unapproved view, click into a day with a configured-field entry, confirm the same pills show in the approval modal's table.

- [ ] **Step 10: Commit**

```bash
git add src/app/pages/time-sheets/time-sheet/components/time-sheet-number-line/ src/app/components/time-sheet-analytics/filter-view-details/ src/app/modals/unapproved-entries/
git commit -m "Render configured field values in the weekly tooltip (HTML-escaped), analytics details table, and approval modal"
```

---

### Task 5: Record the cross-ticket exclusion, verify the full suite, and walk the acceptance criteria

**Files:** none (verification and a Cadence comment only — no further code changes are expected; only touch code here if Step 2 or 3 surfaces a real gap).

**Context:** The ticket names two other tickets this one "feeds... neither automatically": the MCP server's `log_time_entry`/`list_time_entries` tools (a separate backend repo, `time-tracker-api`) and the Louden export (TT-4, not yet built). This plan's Global Constraints already ruled that this plan does not touch either — this task is where that ruling gets *recorded*, per the ticket's own subtask ("Decide whether fieldValues reach TT-3's MCP tools and TT-4's export, or are explicitly excluded — and record the decision on both"), rather than silently left for someone to rediscover later.

- [ ] **Step 1: Full build and test suite**

Run: `ng build`
Run: `ng test --watch=false --browsers=ChromeHeadless`
Expected: both succeed. This is the ticket's own acceptance criterion, verbatim.

- [ ] **Step 2: Walk every acceptance criterion against the running app**

```bash
ng serve
```

Using the two test projects and fields you already configured in Tasks 2-4, confirm each of these (all should already be true from the per-task manual checks, but walk them once end-to-end as a final pass):

- A project can be given an ordered set of extra fields; add, remove, rename and reorder all work in the project editor, and the set survives a full page reload.
- Saving a project with a blank key, a duplicate key, or an option-less `select` is blocked.
- The capture modal shows exactly the selected project's configured fields; changing project swaps the visible set without closing the modal, and switching back restores values already typed.
- A project with no configured fields renders the modal identically to before this ticket, as does the modal opened when no project resolves (e.g. a brand-new entry with nothing in local storage and no projects loaded yet — check the modal doesn't error).
- Saving a new entry with a required configured field empty is blocked, and the red alert names the missing field in the existing bulleted style.
- Values survive a save/reload round trip and render in the weekly tooltip (HTML-escaped) and the analytics details table.
- An entry saved before this change (i.e. any entry that existed before you started testing) opens without error, and can be re-saved with a configured-required field left blank.
- All new controls are disabled when `approved` is true (approve a test entry via the approval modal, then reopen it in the capture modal and confirm every configured-field control is disabled, matching the four pre-existing controls).

- [ ] **Step 3: Record the MCP/export exclusion decision on TT-2, TT-3, and TT-4 in Cadence**

Call `mcp__cadence__add_comment` on this ticket (TT-2) with a message stating: `fieldValues` is implemented in the model/capture/read paths but is **not** wired into the MCP server's `log_time_entry`/`list_time_entries` tools (`time-tracker-api`, TT-3) or the Louden export (TT-4) — both are explicitly excluded pending the actual field spec, per this ticket's own note that leaving it unaddressed would mean "the export omits the exact fields this ticket made capturable, and an agent write bypasses the new required fields." Follow-up work is needed on both once the spec lands.

Call `mcp__cadence__add_comment` on TT-3 (id `dcec971e-6e21-4be4-98fc-0f8446fcbf15`) and TT-4 with a short pointer back to this ticket noting the same exclusion, so whoever picks up either ticket next sees it without having to cross-reference TT-2's full history. Use `mcp__cadence__list_tickets` (project `4db03989-d884-46f7-a4ad-8ca893a44dd9`, `text: "TT-4"`) to find TT-4's ticket id first if it's not already in context.

- [ ] **Step 4: Mark the settled/completed subtasks on TT-2 in Cadence**

Using `mcp__cadence__toggle_subtask`, mark done: "Add the array-shaped ProjectField config to Project and an add/remove/rename/reorder editor in project.page", "Add fieldValues to TimeSheetEntry and render the configured controls in the capture modal, preserving typed values across project switches", "Extend isFormValid for config-required fields with the id-on-open exemption for pre-existing entries", "Render configured values in the weekly tooltip (HTML-escaped), analytics details table and approval modal", "Decide whether fieldValues reach TT-3's MCP tools and TT-4's export, or are explicitly excluded — and record the decision on both", and "Extend time-sheet-entry.modal.spec.ts and verify ng build and ng test --watch=false --browsers=ChromeHeadless both pass".

Leave "Obtain the written Louden/Ammcare field spec..." and "Settle the three gate decisions..." **not done** — those are the two subtasks this plan explicitly could not do (no spec exists yet, and the three gate decisions used the ticket's own *proposed* defaults, not a stakeholder confirmation). Add a comment alongside the subtask toggles saying exactly that, so the ticket's state accurately reflects "mechanism built, spec and gate confirmation still outstanding" rather than reading as fully done.

- [ ] **Step 5: Final commit if Step 2 surfaced any fixes**

If the acceptance-criteria walkthrough in Step 2 required a code change, commit it with a message describing what was wrong. If everything passed as implemented in Tasks 1-4, there is nothing to commit here.
