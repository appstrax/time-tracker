# TT-1: Let users browse their time entries by period — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `/home`'s hardcoded 7-day bar chart with the same filter/view UI `/analytics` already has (Summary/Details/Timeline, status/project/category/date-range filters), self-scoped to the signed-in user, with no admin-only affordances (User dropdown, Unapproved tab).

**Architecture:** Extract six presentational components (`filter-block`, `filter-view-container`, `filter-view-summary`, `filter-view-details`, `filter-view-timeline`, `unapproved-entries`) and the `unapproved-entries` modal out of `pages/analytics/` into the shared `@components`/`@modals` trees, unchanged in behavior except two new opt-out inputs (`availableViews`, `showUserFilter`) on the container. `HomePage` is rewritten to fetch only its own entries (`findByUserId`) and render the shared container with those two inputs narrowed. `/analytics` keeps using the same container with its current defaults (all four views, user filter shown), gaining one behavior fix along the way: the date range defaults to the current calendar month on first load instead of silently showing all history.

**Tech Stack:** Angular 21 standalone components, signals (`input()`/`output()`/`computed()`), `inject()`, `@if`/`@for` control flow, RxJS `Subscription` for `ActivatedRoute.queryParams`.

**Spec:** Cadence ticket TT-1 ("Let users browse their time entries by period") — full description and acceptance criteria fetched via `mcp__cadence__get_ticket`, reproduced inline in each task below where it drives a specific change.

## Global Constraints

- Files must physically move out of `pages/analytics/` — `tsconfig.json` defines `@components`/`@modals`/`@pages` but no deep `@pages/*` alias, so nothing outside `pages/analytics/` can import from inside it.
- Import the relocated modal from the relocated `unapproved-entries` component by deep relative path (`../../../modals/unapproved-entries/unapproved-entries.modal`), never via `@modals` — `@modals` re-exports `time-sheet-entry.modal`, which imports `@components`, which (after this move) re-exports `unapproved-entries.component`; going through the barrel both ways is a cycle.
- `HomePage` must fetch via `TimeSheetEntryService.findByUserId(userId)`, never `findByProjectId` — the self-scoping in every acceptance criterion below depends on the fetch itself only ever returning the signed-in user's rows, not on any UI restriction.
- Do not add `<app-summary-metrics>` to `/home` — it computes from its own unfiltered `entries` input, which would show all-time totals directly above a filter panel that doesn't affect them.
- Do not touch `onApproveAll()` on `FilterViewContainerComponent` — unused by any template today, but it is the sole emitter of `entryUpdated` (which `/analytics` binds) and the sole consumer of the component's `ToastService`/`TimeSheetEntryService` injections. Removing it cascades into unrelated breakage.
- **Testing convention for this codebase:** component specs here are TestBed scaffolds (`it('should create')`) with no assertions on business logic — there is no existing unit-test harness for filter/view logic to extend. Verification in this plan is `npm run build` (strictTemplates is on, so template-input mismatches fail the build) plus the manual browser checklist in Task 5, matching the ticket's own final acceptance item. Do not invent a new Jasmine test suite for this ticket; it would be the only one of its kind in the codebase.
- Commit after each task.

---

### Task 1: Relocate the six components and the modal; fix the broken import and both barrels

**Files:**
- Move: `src/app/pages/analytics/components/filter-block/` → `src/app/components/time-sheet-analytics/filter-block/`
- Move: `src/app/pages/analytics/components/filter-view-container/` → `src/app/components/time-sheet-analytics/filter-view-container/`
- Move: `src/app/pages/analytics/components/filter-view-summary/` → `src/app/components/time-sheet-analytics/filter-view-summary/`
- Move: `src/app/pages/analytics/components/filter-view-details/` → `src/app/components/time-sheet-analytics/filter-view-details/`
- Move: `src/app/pages/analytics/components/filter-view-timeline/` → `src/app/components/time-sheet-analytics/filter-view-timeline/`
- Move: `src/app/pages/analytics/components/unapproved-entries/` → `src/app/components/time-sheet-analytics/unapproved-entries/`
- Move: `src/app/pages/analytics/modals/unapproved-entries/` → `src/app/modals/unapproved-entries/`
- Modify: `src/app/components/time-sheet-analytics/unapproved-entries/unapproved-entries.component.ts`
- Modify: `src/app/pages/analytics/components/index.ts`
- Modify: `src/app/components/index.ts`
- Modify: `src/app/modals/index.ts`
- Modify: `src/app/pages/analytics/analytics.page.ts`

**Interfaces:**
- Produces: `@components` now exports `FilterBlockComponent`, `FilterViewContainerComponent`, `FilterView` (type), `FilterViewSummaryComponent`, `FilterViewDetailsComponent`, `FilterViewTimelineComponent`, `UnapprovedEntriesComponent`. `@modals` now exports `UnapprovedEntriesModalComponent`. Later tasks (2, 4) import `FilterViewContainerComponent`/`FilterView` from `@components`.

- [ ] **Step 1: Move the six component directories with `git mv`, preserving history**

```bash
cd /Users/brentonscott/Documents/Development/time-tracker
mkdir -p src/app/components/time-sheet-analytics
git mv src/app/pages/analytics/components/filter-block src/app/components/time-sheet-analytics/filter-block
git mv src/app/pages/analytics/components/filter-view-container src/app/components/time-sheet-analytics/filter-view-container
git mv src/app/pages/analytics/components/filter-view-summary src/app/components/time-sheet-analytics/filter-view-summary
git mv src/app/pages/analytics/components/filter-view-details src/app/components/time-sheet-analytics/filter-view-details
git mv src/app/pages/analytics/components/filter-view-timeline src/app/components/time-sheet-analytics/filter-view-timeline
git mv src/app/pages/analytics/components/unapproved-entries src/app/components/time-sheet-analytics/unapproved-entries
```

The four components that stay behind (`metric-card`, `projects-block`, `summary-metrics`) are untouched by this move — do not move them.

- [ ] **Step 2: Move the modal directory, then remove the now-empty parent**

```bash
git mv src/app/pages/analytics/modals/unapproved-entries src/app/modals/unapproved-entries
rmdir src/app/pages/analytics/modals 2>/dev/null || true
```

- [ ] **Step 3: Fix the modal import inside the relocated `unapproved-entries.component.ts`**

The component moved from `src/app/pages/analytics/components/unapproved-entries/` to `src/app/components/time-sheet-analytics/unapproved-entries/` — one directory level deeper — while the modal moved to `src/app/modals/unapproved-entries/`. The old `'../../modals/unapproved-entries/unapproved-entries.modal'` import no longer resolves.

In `src/app/components/time-sheet-analytics/unapproved-entries/unapproved-entries.component.ts`, change:

```ts
import { UnapprovedEntriesModalComponent } from '../../modals/unapproved-entries/unapproved-entries.modal';
```

to:

```ts
import { UnapprovedEntriesModalComponent } from '../../../modals/unapproved-entries/unapproved-entries.modal';
```

Import it by this relative path, not via `@modals` (see Global Constraints — the cycle risk).

- [ ] **Step 4: Trim the local analytics components barrel to just what stayed**

Replace the full contents of `src/app/pages/analytics/components/index.ts` with:

```ts
export * from './metric-card/metric-card.component';
export * from './projects-block/projects-block.component';
export * from './summary-metrics/summary-metrics.component';
```

- [ ] **Step 5: Add the six moved components to the shared `@components` barrel**

Replace the full contents of `src/app/components/index.ts` with:

```ts
export * from './side-nav/side-nav.component';
export * from './kanban-board/kanban-board.component';
export * from './side-nav/expanded/side-nav-expanded.component';
export * from './side-nav/collapsed/side-nav-collapsed.component';
export * from './toast-container/toast-container.component';
export * from './project-dropdown/project-dropdown.component';
export * from './page-layout/page-layout.component';
export * from './project-users/project-users.component';
export * from './user-avatar/user-avatar.component';
export * from './time-sheet-analytics/filter-block/filter-block.component';
export * from './time-sheet-analytics/filter-view-container/filter-view-container.component';
export * from './time-sheet-analytics/filter-view-summary/filter-view-summary.component';
export * from './time-sheet-analytics/filter-view-details/filter-view-details.component';
export * from './time-sheet-analytics/filter-view-timeline/filter-view-timeline.component';
export * from './time-sheet-analytics/unapproved-entries/unapproved-entries.component';
```

Note `filter-view-details` is included this time — the old `pages/analytics/components/index.ts` omitted it (it was only ever reached by relative import within `pages/analytics/`).

- [ ] **Step 6: Add the moved modal to the `@modals` barrel**

Replace the full contents of `src/app/modals/index.ts` with:

```ts
export * from './agent-token-created/agent-token-created.modal';
export * from './confirm/confirm.modal';
export * from './time-sheet-entry/time-sheet-entry.modal';
export * from './unapproved-entries/unapproved-entries.modal';
```

- [ ] **Step 7: Update `AnalyticsPage`'s import to pull the container from `@components`**

In `src/app/pages/analytics/analytics.page.ts`, change:

```ts
import { FormsModule } from '@angular/forms';
import { Component, OnInit, inject, signal } from '@angular/core';

import { TimeSheetEntry, User } from '@models';
import { TimeSheetEntryService, ToastService, UsersService } from '@services';
import { Store } from '@state';

import {
  FilterViewContainerComponent,
  SummaryMetricsComponent,
} from './components';
```

to:

```ts
import { FormsModule } from '@angular/forms';
import { Component, OnInit, inject, signal } from '@angular/core';

import { FilterViewContainerComponent } from '@components';
import { TimeSheetEntry, User } from '@models';
import { TimeSheetEntryService, ToastService, UsersService } from '@services';
import { Store } from '@state';

import { SummaryMetricsComponent } from './components';
```

The rest of the file (the `@Component` decorator's `imports: [...]` array, all methods) is unchanged — both symbols are still in scope, just from different import statements.

- [ ] **Step 8: Verify the move is structurally sound**

```bash
npm run build
```

Expected: succeeds. If it fails on a missing module, the error will name the old `pages/analytics/components/...` or `pages/analytics/modals/...` path — grep for that path across `src/` and fix the remaining reference (Step 3 and Step 7 above are the only two production-code references that existed outside the moved trees; the spec files and `analytics.page.html` do not reference file paths, only selectors, so they need no changes).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Move analytics filter/view components and unapproved-entries modal to shared trees"
```

---

### Task 2: Add `availableViews` and `showUserFilter` inputs to `FilterViewContainerComponent`

**Files:**
- Modify: `src/app/components/time-sheet-analytics/filter-view-container/filter-view-container.component.ts`
- Modify: `src/app/components/time-sheet-analytics/filter-view-container/filter-view-container.component.html`
- Modify: `src/app/components/time-sheet-analytics/filter-view-container/filter-view-container.component.scss`

**Interfaces:**
- Consumes: `FilterView` type (already defined in this file, unchanged).
- Produces: two new inputs on `FilterViewContainerComponent` — `availableViews = input<FilterView[]>(['summary', 'details', 'timeline', 'unapproved'])` and `showUserFilter = input(true)` — that Task 4 (`HomePage`) binds to `['summary', 'details', 'timeline']` and `false` respectively. A new `activeView` computed signal that Task 4/existing template consumers do not reference directly — it's internal to this component's own template.

- [ ] **Step 1: Add the two inputs and the clamp/filter computeds**

In `filter-view-container.component.ts`, insert two new lines directly after the existing `users` input line and before the (unchanged) `entryUpdated` output line, so the block reads:

```ts
  public readonly projects = input<Project[]>([]);
  public readonly entries = input<TimeSheetEntry[]>([]);
  public readonly users = input<User[]>([]);
  public readonly availableViews = input<FilterView[]>([
    'summary',
    'details',
    'timeline',
    'unapproved',
  ]);
  public readonly showUserFilter = input(true);

  public readonly entryUpdated = output<TimeSheetEntry>();
```

Only the `availableViews`/`showUserFilter` lines (and the blank line after them) are new — `entryUpdated` already exists in the file exactly as shown; do not remove or move it.

Add these two computed signals directly below the existing `viewTypes` array field:

```ts
  public readonly visibleViewTypes = computed(() =>
    this.viewTypes.filter((viewType) =>
      this.availableViews().includes(viewType.value),
    ),
  );

  public readonly activeView = computed<FilterView>(() => {
    const available = this.availableViews();
    const current = this.view();
    return available.includes(current) ? current : available[0];
  });
```

`activeView` is what "clamp the rendered view to the list so an out-of-list value can never render" means here: `view()` itself is still whatever the user last clicked (or the `'summary'` default), but every render decision in the template reads `activeView()`, which falls back to `available[0]` whenever `view()` isn't in the current `availableViews()`. This can't be empty in practice — both callers (`/analytics`'s default and `HomePage`'s `['summary', 'details', 'timeline']`) always pass at least one view — but there's no runtime guard against a caller passing `[]`; that's an acceptable footgun for an internal-only input with two known call sites, not something this task needs to defend against.

- [ ] **Step 2: Point the view-type button grid and the active-view template checks at the new computeds**

In `filter-view-container.component.html`, change the view-type grid's `@for` source and active-class check:

```html
        <div class="view-type-grid">
          @for (viewType of viewTypes; track viewType.value) {
            <button
              type="button"
              class="view-type-option"
              [class.active]="view() === viewType.value"
              (click)="onViewTypeChange(viewType.value)"
            >
```

to:

```html
        <div class="view-type-grid">
          @for (viewType of visibleViewTypes(); track viewType.value) {
            <button
              type="button"
              class="view-type-option"
              [class.active]="activeView() === viewType.value"
              (click)="onViewTypeChange(viewType.value)"
            >
```

Then change the view-content block from:

```html
  <div class="view-content">
    @if (view() === "summary") {
      <app-filter-view-summary
        [entries]="filteredEntries()"
        [projects]="projects()"
      ></app-filter-view-summary>
    } @else if (view() === "details") {
      <app-filter-view-details
        [entries]="filteredEntries()"
        [projects]="projects()"
      ></app-filter-view-details>
    } @else if (view() === "timeline") {
      <app-filter-view-timeline
        [entries]="filteredEntries()"
        [projects]="projects()"
      ></app-filter-view-timeline>
    } @else if (view() === "unapproved") {
      <app-unapproved-entries [timeSheetEntries]="filteredEntries()" />
    }
  </div>
```

to:

```html
  <div class="view-content">
    @if (activeView() === "summary") {
      <app-filter-view-summary
        [entries]="filteredEntries()"
        [projects]="projects()"
      ></app-filter-view-summary>
    } @else if (activeView() === "details") {
      <app-filter-view-details
        [entries]="filteredEntries()"
        [projects]="projects()"
      ></app-filter-view-details>
    } @else if (activeView() === "timeline") {
      <app-filter-view-timeline
        [entries]="filteredEntries()"
        [projects]="projects()"
      ></app-filter-view-timeline>
    } @else if (activeView() === "unapproved") {
      <app-unapproved-entries [timeSheetEntries]="filteredEntries()" />
    }
  </div>
```

- [ ] **Step 3: Hide the User filter block when `showUserFilter` is false**

In the same HTML file, wrap the existing User `app-filter-block` (it sits between the Category block and the Date Range block) with an `@if`:

```html
          <app-filter-block label="User">
            <div class="filter-select-wrap">
              <select
                class="form-select filter-select"
                [ngModel]="filter().userId ?? ''"
                (ngModelChange)="onUserChange($event)"
              >
                <option [value]="''">All Users</option>
                @for (user of users(); track user.id) {
                  <option [value]="user.id">
                    {{ getDisplayName(user) }}
                  </option>
                }
              </select>
              <i
                class="bi bi-chevron-down filter-select-caret"
                aria-hidden="true"
              ></i>
            </div>
          </app-filter-block>
```

becomes:

```html
          @if (showUserFilter()) {
            <app-filter-block label="User">
              <div class="filter-select-wrap">
                <select
                  class="form-select filter-select"
                  [ngModel]="filter().userId ?? ''"
                  (ngModelChange)="onUserChange($event)"
                >
                  <option [value]="''">All Users</option>
                  @for (user of users(); track user.id) {
                    <option [value]="user.id">
                      {{ getDisplayName(user) }}
                    </option>
                  }
                </select>
                <i
                  class="bi bi-chevron-down filter-select-caret"
                  aria-hidden="true"
                ></i>
              </div>
            </app-filter-block>
          }
```

- [ ] **Step 4: Add `:host { display: block; }` to the container's own stylesheet**

The container currently renders as `display: block` only because `analytics.page.scss` sets `app-filter-view-container { display: block; }`. That rule is view-encapsulated to `AnalyticsPage` and will not apply once the container is used from `HomePage`. Add the host rule directly to the component so it's correct everywhere it's used.

At the very top of `filter-view-container.component.scss`, before the existing `.filter-view-container { ... }` rule, add:

```scss
:host {
  display: block;
}

```

- [ ] **Step 5: Verify `/analytics` is unaffected**

```bash
npm run build
```

Expected: succeeds. `AnalyticsPage` doesn't set `[availableViews]` or `[showUserFilter]`, so both inputs use their defaults (all four views, user filter shown) — `/analytics`'s behavior must be identical to before this task except for layout (the new `:host` rule replaces the old page-level rule with the same value, so no visible change).

Manually confirm in the browser: open `/analytics` as an admin, confirm all four view buttons (Summary, Details, Timeline, Unapproved) are present and the User filter dropdown is still there.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add availableViews and showUserFilter inputs to FilterViewContainerComponent"
```

---

### Task 3: Fix the unbounded first paint — seed missing date-range bounds

**Files:**
- Modify: `src/app/components/time-sheet-analytics/filter-view-container/filter-view-container.component.ts`

**Interfaces:**
- Consumes: `TimeSheetFilterUtil.calculateDateRangeBounds(dateRange, start?, end?): { start: Date; end: Date }` (already exists, unchanged) and `TimeSheetFilterUtil.parseFilters(params): AnalyticsFilter` (already exists, unchanged).

**Context:** `TimeSheetFilterUtil.parseFilters` returns `{ dateRange: 'month', start: undefined, end: undefined, ... }` when there are no query params — it never calls `calculateDateRangeBounds` itself. `filterEntries()` only applies a date bound when `filters.start`/`filters.end` are actually set:

```ts
if (filters.start && e.date < filters.start) return false;
if (filters.end && e.date > filters.end) return false;
```

So on first load with no query params, the UI displays "This Month" in the Date Range dropdown while `filterEntries()` applies no date bound at all — every entry the user has ever created is shown. This task fixes that by seeding `start`/`end` from `calculateDateRangeBounds` whenever they come back undefined from `parseFilters`, before the filter signal is set. This intentionally changes `/analytics`'s default too — its first-load behavior goes from "all history labeled This Month" to "the current calendar month," which is the one intended behavior change to `/analytics` in this ticket.

- [ ] **Step 1: Seed the bounds in `ngOnInit`**

In `filter-view-container.component.ts`, change:

```ts
  ngOnInit(): void {
    this.subscription = this.route.queryParams.subscribe((params) => {
      const filter = this.filterUtils.parseFilters(params);
      this.filter.set(filter);
      this.filterEntries();
    });
  }
```

to:

```ts
  ngOnInit(): void {
    this.subscription = this.route.queryParams.subscribe((params) => {
      const filter = this.filterUtils.parseFilters(params);
      if (!filter.start || !filter.end) {
        const bounds = this.filterUtils.calculateDateRangeBounds(
          filter.dateRange ?? 'month',
          filter.start,
          filter.end,
        );
        filter.start = bounds.start;
        filter.end = bounds.end;
      }
      this.filter.set(filter);
      this.filterEntries();
    });
  }
```

Do not call `this.updateFilters(...)` or `this.filterUtils.updateQueryParams(...)` here — that would call `router.navigate`, which re-triggers this same `queryParams` subscription and creates a redundant round trip (possibly a loop if the computed bounds don't exactly match what's already in the URL, e.g. on a page that was loaded with `dateRange=month` but no `start`/`end`). Setting `this.filter` directly is sufficient: `filterEntries()` (called right after) reads the signal synchronously, and `filter().start`/`filter().end` end up correct for every subsequent read (e.g. the custom-date-range inputs' `formatDate(filter().start)` bindings) without a navigation.

`filter.dateRange ?? 'month'` — `parseFilters` always returns a value here (`'month'` is its own fallback), so the `?? 'month'` is defensive, not load-bearing; kept for clarity that this mirrors `parseFilters`'s own default.

- [ ] **Step 2: Verify the month-bounded default manually**

```bash
npm run build
```

Then in the browser: open `/analytics` (or, after Task 4, `/home`) with no query params. Confirm:
- The Date Range dropdown shows "This Month".
- The Details/Timeline/Summary views only show entries dated within the current calendar month — not entries from other months.
- Changing the Date Range dropdown to "All" still shows full history (this path already worked, since `calculateDateRangeBounds('all', ...)` returns `{ start: new Date(0), end: endOfDay(today) }` regardless of how it's invoked — confirms this change didn't touch that path).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "Seed month-bounded date range on first load instead of showing all history"
```

---

### Task 4: Rewrite `HomePage` to the self-scoped filter/view UI

**Files:**
- Modify: `src/app/pages/home/home.page.ts`
- Modify: `src/app/pages/home/home.page.html`
- Modify: `src/app/pages/home/home.page.scss`

**Interfaces:**
- Consumes: `FilterViewContainerComponent` and `FilterView` type from `@components` (Task 1); its `[projects]`, `[entries]`, `[users]`, `[showUserFilter]`, `[availableViews]` inputs (Task 2 added the last two); `TimeSheetEntryService.findByUserId(userId: string): Promise<TimeSheetEntry[]>` (existing, unchanged); `Store.user.user()`, `Store.user.loading()`, `Store.projects.projects()`, `Store.projects.loading()` (existing, unchanged).

- [ ] **Step 1: Replace `home.page.ts`**

Replace the full contents of `src/app/pages/home/home.page.ts` with:

```ts
import { Component, computed, effect, inject, signal } from '@angular/core';

import { FilterView, FilterViewContainerComponent } from '@components';
import { TimeSheetEntry, User } from '@models';
import { TimeSheetEntryService, ToastService } from '@services';
import { Store } from '@state';

@Component({
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [FilterViewContainerComponent],
})
export class HomePage {
  private readonly store = inject(Store);
  private readonly timeSheetEntryService = inject(TimeSheetEntryService);
  private readonly toast = inject(ToastService);

  public readonly isLoading = signal(true);
  public readonly hasLoaded = signal(false);
  public readonly entries = signal<TimeSheetEntry[]>([]);
  public readonly projects = computed(() => this.store.projects.projects());
  public readonly hasProjects = computed(() => this.projects().length > 0);

  public readonly noUsers: User[] = [];
  public readonly homeAvailableViews: FilterView[] = [
    'summary',
    'details',
    'timeline',
  ];

  private latestLoadId = 0;

  constructor() {
    effect(() => {
      const user = this.store.user.user();
      const userLoading = this.store.user.loading();
      const projects = this.store.projects.projects();
      const projectsLoading = this.store.projects.loading();

      if (userLoading || (projectsLoading && user?.id && !projects.length)) {
        this.isLoading.set(true);
        return;
      }

      if (!user?.id) {
        this.isLoading.set(false);
        this.hasLoaded.set(true);
        this.entries.set([]);
        return;
      }

      void this.loadEntries(user.id);
    });
  }

  private async loadEntries(userId: string): Promise<void> {
    const loadId = ++this.latestLoadId;
    this.isLoading.set(true);

    try {
      const entries = await this.timeSheetEntryService.findByUserId(userId);
      if (loadId !== this.latestLoadId) return;
      this.entries.set(entries);
    } catch {
      if (loadId !== this.latestLoadId) return;
      this.entries.set([]);
      this.toast.error('Unable to load your time entries.');
    } finally {
      if (loadId !== this.latestLoadId) return;
      this.isLoading.set(false);
      this.hasLoaded.set(true);
    }
  }
}
```

This drops `graphData`/`totalHours`/`activeProjects`/`hasCapturedHours`/`rangeStart`/`rangeEnd`/`rangeLabel`/`createRangeStart`/`createRangeEnd`/`formatRangeLabel`/`formatHours`/`loadGraphData` entirely — the bar-chart-specific state and the 7-day window helpers. `isLoading`/`hasLoaded`/`latestLoadId` and the constructor's reactive-loading `effect()` are kept as-is (same race-guard pattern, now guarding `entries` instead of `graphData`).

- [ ] **Step 2: Replace `home.page.html`**

Replace the full contents of `src/app/pages/home/home.page.html` with:

```html
<section class="home-hours-page container py-4">
  <header class="page-header">
    <div>
      <p class="eyebrow">Home</p>
      <h1>My time</h1>
      <p class="subtitle">
        Review your captured hours. Switch views and filter by project,
        category, or date range.
      </p>
    </div>
  </header>

  @if (isLoading() && !hasLoaded()) {
    <section class="state-card">
      <h2>Loading your time entries</h2>
      <p>Pulling your captured hours.</p>
    </section>
  } @else if (!hasProjects()) {
    <section class="state-card">
      <h2>No accessible projects</h2>
      <p>There are no projects available for this account yet.</p>
    </section>
  } @else {
    <app-filter-view-container
      [projects]="projects()"
      [entries]="entries()"
      [users]="noUsers"
      [showUserFilter]="false"
      [availableViews]="homeAvailableViews"
    />
  }
</section>
```

- [ ] **Step 3: Trim `home.page.scss` to drop the now-dead bar-chart rules**

Replace the full contents of `src/app/pages/home/home.page.scss` with:

```scss
.home-hours-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  color: var(--text-primary);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.eyebrow {
  margin: 0 0 0.4rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--primary-color);
}

.page-header h1 {
  margin: 0;
  font-size: clamp(1.75rem, 3vw, 2.4rem);
}

.subtitle {
  margin: 0.5rem 0 0;
  max-width: 42rem;
  color: var(--text-muted);
}

.state-card {
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  background: var(--color-surface);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
  padding: 1.25rem 1.3rem;
}

.state-card h2 {
  margin: 0 0 0.4rem;
  font-size: 1.15rem;
}

.state-card p {
  margin: 0;
  color: var(--text-muted);
}

@media (max-width: 767px) {
  .home-hours-page {
    gap: 1rem;
  }
}
```

This removes `.range-chip`, `.summary-grid`/`.summary-card`/`.summary-label`, `.state-card.muted`, `.graph-card`/`.graph-list`/`.graph-row`/`.row-header`/`.project-label`/`.hours-label`/`.bar-track`/`.bar-fill`/`.bar-fill-empty`, and the now-irrelevant parts of the mobile media query — all of it was specific to the bar chart or the summary cards above it, neither of which exist on `/home` anymore.

- [ ] **Step 4: Build**

```bash
npm run build
```

Expected: succeeds. strictTemplates is on, so if `[availableViews]`/`[showUserFilter]` were misspelled or mistyped relative to Task 2's input names, this is where it surfaces.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Rewrite HomePage to use the self-scoped filter/view container"
```

---

### Task 5: Full manual verification against every acceptance criterion

**Files:** none (verification only).

No code changes in this task — it exists to walk every acceptance criterion in the ticket explicitly, since this codebase's test suite doesn't cover this behavior. Do this with a non-admin test user logged in (an admin account will still see `/analytics`'s admin affordances, which is expected and not what this task is checking).

- [ ] **Step 1: Start the app and log in as a non-admin user**

```bash
npm start
```

Log in as a user whose role is not `admin` (check `UserRole` in `@models` / the seeded test users if unsure which account that is).

- [ ] **Step 2: Check `/home`'s filter/view behavior**

Navigate to `/home`. Confirm:
- The Date Range dropdown defaults to "This Week"/"This Month"/etc. selectable, and with no query params it reads "This Month" and only entries inside the current calendar month are shown (Task 3's fix).
- Selecting This Week / This Month / This Year / All / Custom updates the results each time.
- The Summary, Details, and Timeline view buttons are all present and clickable; the Unapproved button is **not** present.
- The Details view lists individual entries grouped by day, each showing project, hours, category, and approval state — not just a per-project total.
- The User dropdown is **not** present anywhere in the filter panel.

- [ ] **Step 3: Check the network tab**

With devtools open on `/home`, reload. Confirm:
- Exactly one request is made to the `time-sheet-entries` collection (via `findByUserId`), and its `where` clause is `{ userId: <the signed-in user's id> }` — not a project-id-based query.
- No request is made to `/api/users`.

- [ ] **Step 4: Check the hand-crafted `?userId=` case**

Navigate to `/home?userId=<some other real user id>`. Confirm the page renders its normal empty state for the Details/Summary/Timeline views (zero entries) with **no error toast** — the fetch already only returned the signed-in user's rows, so the extra filter just narrows an already-self-scoped set to nothing, as designed. This should require no code changes if Tasks 1–4 were followed exactly; if it fails, the fetch is not correctly using `findByUserId`.

- [ ] **Step 5: Check filter persistence**

On `/home`, change the Date Range to "This Week" and the Category filter to some non-empty value (if any entries have categories). Confirm the URL's query params update. Reload the page. Confirm the same filter state is restored from the URL.

- [ ] **Step 6: Check `/analytics` is still admin-only and fully featured**

Log in as an admin. Navigate to `/analytics`. Confirm:
- All four views (Summary, Details, Timeline, Unapproved) are present.
- The User dropdown is present and populated.
- The only behavior change versus before this ticket is the month-bounded default (Task 3) — everything else (approving entries, the summary metric cards, the project filter, etc.) works exactly as before.

Log out and confirm a non-admin cannot reach `/analytics` (redirected or blocked by `AdminGuard`, as before — this ticket does not touch `AdminGuard` or the route config).

- [ ] **Step 7: Final build check**

```bash
npm run build
```

Expected: succeeds with no errors or new warnings.

- [ ] **Step 8: Commit if Step 2–6 surfaced any fixes; otherwise this task produces no diff**

If any of the manual checks above required a code fix, commit it with a message describing what was wrong. If everything passed as implemented in Tasks 1–4, there is nothing to commit here.
