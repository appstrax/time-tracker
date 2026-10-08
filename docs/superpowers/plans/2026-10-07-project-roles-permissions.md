# TT-54 Project Role Permissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce contributor / viewer / approver / admin project permissions in the Angular app, and in the MCP API's `createEntry`.

**Architecture:** One pure function (`resolveProjectPermissions`) maps `(project role, platform admin)` to `{ logTime, viewAnalytics, approve }`. A thin `ProjectAccessStore` holds the user's `projectId -> role` memberships and exposes derived project lists. Guards, nav, pickers and approve buttons all read that store. The API mirrors the same rule for create.

**Tech Stack:** Angular 21 (standalone, signals, `@ngrx/signals`), Karma/Jasmine (`ng test`); API: TypeScript, mocha (`npm test` after `npm run build`).

**Spec:** `docs/superpowers/specs/2026-10-07-project-roles-permissions-design.md`

## Global Constraints

- Platform admin (`UserRole.ADMIN`) keeps today's scope everywhere; project role `admin` is a label: it grants **log time only** (as today), nothing else.
- Unknown / missing role => no permissions. Never default to contributor.
- Contributor behaviour must not change. A non-admin with **no memberships** keeps today's empty Home; only users with analytics access and no log access are redirected.
- Viewer/approver-only users land on `/analytics`.
- Approver update = flipping `approved` only.
- Entries on projects where the user is a member but cannot log time are hidden from their time sheet and Home. Entries on projects they have since left stay visible (existing behaviour).
- Enforcement limit: UI + MCP only; direct collection calls with a token are not blocked (documented, not fixed).
- Code style: match surrounding code (2-space, single quotes, `inject()`/signals in new code, path aliases `@models @state @utils @services`).

## Review Focus

- A role string like `'toString'`/`'constructor'` or `''` must resolve to no permissions (prototype-key lookup bug).
- Platform admin who is *not* a member of a project must not be able to log time on it (today's behaviour), but can view analytics/approve.
- Mixed-role user: log pickers contain only contributor/project-admin projects; analytics list only viewer/approver projects.
- Direct URL `/analytics/<unassigned id>` redirects with a toast, and `/analytics/<id>` for a contributor-only project is also denied.
- Role removed / changed while app is open: guard refetches memberships on every guarded navigation.
- Approver handlers (`setApproved`, `approveDay`) are no-ops for a viewer even if invoked directly.

---

## File Structure

Frontend (`C:\Dev\Appstrax Projects\time-tracker`):
- Create `src/app/utils/project-access.util.ts` (+ `.spec.ts`): pure permission rules and project filtering.
- Create `src/app/state/project-access.store.ts` (+ `.spec.ts`): memberships + derived lists.
- Modify `src/app/state/index.ts`, `src/app/state/store.ts`: export and expose `store.access`, load in `init()`.
- Create `src/app/utils/log-time.guard.ts`, `src/app/utils/analytics.guard.ts` (+ specs). Modify `src/app/utils/index.ts`, `src/app/app.routes.ts`.
- Modify `side-nav-expanded.component.{ts,html}`.
- Modify `time-sheet.page.ts`, `time-sheet-entry.modal.ts`, `home.page.ts`; delete `filterAssignedProjects` from `time-sheet-project.util.ts` and its spec.
- Modify `analytics.page.ts`, `project-analytics.page.{ts,html}`.

API (`C:\Dev\Appstrax Projects\time-tracker-api`, branch off `dev`):
- Modify `src/domain/models/project-user.ts`, `src/domain/services/project-user.service.ts`, `src/domain/services/time-sheet-entry.service.ts`, tests in `src/__tests__/`, README.

Test command (frontend): `npx ng test --watch=false --browsers=ChromeHeadless`.
API: `npm run build && npm test`.

---

### Task 1: Pure permission rules

**Files:**
- Create: `src/app/utils/project-access.util.ts`, `src/app/utils/project-access.util.spec.ts`
- Modify: `src/app/utils/index.ts` (add `export * from './project-access.util';`)

**Interfaces:**
- Produces:
  - `type ProjectMemberships = Readonly<Record<string, string>>`
  - `interface ProjectPermissions { logTime: boolean; viewAnalytics: boolean; approve: boolean }`
  - `resolveProjectPermissions(role: string | undefined, platformAdmin: boolean): ProjectPermissions`
  - `roleOf(memberships: ProjectMemberships, projectId: string): string | undefined`
  - `filterProjectsByPermission(projects: Project[], memberships: ProjectMemberships, platformAdmin: boolean, permission: keyof ProjectPermissions): Project[]`
  - `needsAnalyticsLanding(memberships: ProjectMemberships, platformAdmin: boolean): boolean` (true when the user has analytics access and no log access)

- [ ] **Step 1: Write the failing spec** (`project-access.util.spec.ts`)

```ts
import { Project, ProjectUserRole } from '@models';

import {
  filterProjectsByPermission,
  needsAnalyticsLanding,
  resolveProjectPermissions,
} from './project-access.util';

const project = (id: string): Project => Object.assign(new Project(), { id });

describe('resolveProjectPermissions', () => {
  it('lets a contributor log time only', () => {
    expect(resolveProjectPermissions(ProjectUserRole.CONTRIBUTOR, false)).toEqual(
      { logTime: true, viewAnalytics: false, approve: false },
    );
  });

  it('lets a project admin log time only (label, no extra power)', () => {
    expect(resolveProjectPermissions(ProjectUserRole.ADMIN, false)).toEqual(
      { logTime: true, viewAnalytics: false, approve: false },
    );
  });

  it('lets a viewer view analytics only', () => {
    expect(resolveProjectPermissions(ProjectUserRole.VIEWER, false)).toEqual(
      { logTime: false, viewAnalytics: true, approve: false },
    );
  });

  it('lets an approver view analytics and approve', () => {
    expect(resolveProjectPermissions(ProjectUserRole.APPROVER, false)).toEqual(
      { logTime: false, viewAnalytics: true, approve: true },
    );
  });

  it('grants nothing for missing, empty or unrecognised roles', () => {
    const none = { logTime: false, viewAnalytics: false, approve: false };
    for (const role of [undefined, '', 'owner', 'toString', 'constructor']) {
      expect(resolveProjectPermissions(role, false)).toEqual(none);
    }
  });

  it('gives a platform admin analytics and approval everywhere, log time only as a member', () => {
    expect(resolveProjectPermissions(undefined, true)).toEqual(
      { logTime: false, viewAnalytics: true, approve: true },
    );
    expect(resolveProjectPermissions(ProjectUserRole.VIEWER, true)).toEqual(
      { logTime: true, viewAnalytics: true, approve: true },
    );
  });
});

describe('filterProjectsByPermission', () => {
  const projects = [project('a'), project('b'), project('c')];
  const memberships = {
    a: ProjectUserRole.CONTRIBUTOR,
    b: ProjectUserRole.VIEWER,
    c: ProjectUserRole.APPROVER,
  };

  it('keeps only projects whose role grants the permission', () => {
    expect(
      filterProjectsByPermission(projects, memberships, false, 'logTime').map((p) => p.id),
    ).toEqual(['a']);
    expect(
      filterProjectsByPermission(projects, memberships, false, 'viewAnalytics').map((p) => p.id),
    ).toEqual(['b', 'c']);
    expect(
      filterProjectsByPermission(projects, memberships, false, 'approve').map((p) => p.id),
    ).toEqual(['c']);
  });

  it('returns every project for a platform admin analytics list, member projects for log time', () => {
    expect(
      filterProjectsByPermission(projects, { a: ProjectUserRole.VIEWER }, true, 'viewAnalytics'),
    ).toHaveSize(3);
    expect(
      filterProjectsByPermission(projects, { a: ProjectUserRole.VIEWER }, true, 'logTime').map((p) => p.id),
    ).toEqual(['a']);
  });
});

describe('needsAnalyticsLanding', () => {
  it('is true for viewer-only and approver-only users', () => {
    expect(needsAnalyticsLanding({ a: ProjectUserRole.VIEWER }, false)).toBeTrue();
    expect(
      needsAnalyticsLanding({ a: ProjectUserRole.VIEWER, b: ProjectUserRole.APPROVER }, false),
    ).toBeTrue();
  });

  it('is false for contributors, mixed-role users, platform admins and users with no memberships', () => {
    expect(needsAnalyticsLanding({ a: ProjectUserRole.CONTRIBUTOR }, false)).toBeFalse();
    expect(
      needsAnalyticsLanding({ a: ProjectUserRole.CONTRIBUTOR, b: ProjectUserRole.VIEWER }, false),
    ).toBeFalse();
    expect(needsAnalyticsLanding({ a: ProjectUserRole.VIEWER }, true)).toBeFalse();
    expect(needsAnalyticsLanding({}, false)).toBeFalse();
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npx ng test --watch=false --browsers=ChromeHeadless --include='src/app/utils/project-access.util.spec.ts'`. Expected: FAIL, module not found.

- [ ] **Step 3: Implement** (`project-access.util.ts`)

```ts
import { Project, ProjectUserRole } from '@models';

export type ProjectMemberships = Readonly<Record<string, string>>;

export interface ProjectPermissions {
  logTime: boolean;
  viewAnalytics: boolean;
  approve: boolean;
}

const NONE: ProjectPermissions = {
  logTime: false,
  viewAnalytics: false,
  approve: false,
};

/** A `Map`, not an object, so role strings like `'toString'` can't hit a prototype key. */
const PERMISSIONS_BY_ROLE = new Map<string, ProjectPermissions>([
  [ProjectUserRole.ADMIN, { logTime: true, viewAnalytics: false, approve: false }],
  [ProjectUserRole.CONTRIBUTOR, { logTime: true, viewAnalytics: false, approve: false }],
  [ProjectUserRole.VIEWER, { logTime: false, viewAnalytics: true, approve: false }],
  [ProjectUserRole.APPROVER, { logTime: false, viewAnalytics: true, approve: true }],
]);

/**
 * What a user may do on one project. `role` is their project role (`undefined`
 * when not a member). A platform admin sees and approves everything but, as
 * before, only logs time on projects they are a member of.
 */
export function resolveProjectPermissions(
  role: string | undefined,
  platformAdmin: boolean,
): ProjectPermissions {
  if (platformAdmin) {
    return { logTime: role !== undefined, viewAnalytics: true, approve: true };
  }
  return (role !== undefined && PERMISSIONS_BY_ROLE.get(role)) || NONE;
}

export function roleOf(
  memberships: ProjectMemberships,
  projectId: string,
): string | undefined {
  return Object.hasOwn(memberships, projectId) ? memberships[projectId] : undefined;
}

export function filterProjectsByPermission(
  projects: Project[],
  memberships: ProjectMemberships,
  platformAdmin: boolean,
  permission: keyof ProjectPermissions,
): Project[] {
  return projects.filter(
    (project) =>
      resolveProjectPermissions(roleOf(memberships, project.id), platformAdmin)[
        permission
      ],
  );
}

/** Viewer/approver-only users have nothing to log, so they start on analytics. */
export function needsAnalyticsLanding(
  memberships: ProjectMemberships,
  platformAdmin: boolean,
): boolean {
  if (platformAdmin) return false;
  const all = Object.values(memberships).map((role) =>
    resolveProjectPermissions(role, false),
  );
  return (
    all.some((p) => p.viewAnalytics) && !all.some((p) => p.logTime)
  );
}
```

- [ ] **Step 4: Run spec to verify it passes.**
- [ ] **Step 5: Commit** — `git add src/app/utils && git commit -m "feat(access): pure project permission rules"`

---

### Task 2: ProjectAccessStore

**Files:**
- Create: `src/app/state/project-access.store.ts`, `src/app/state/project-access.store.spec.ts`
- Modify: `src/app/state/index.ts` (export), `src/app/state/store.ts`

**Interfaces:**
- Consumes: Task 1 helpers; `UserStore.user()`, `ProjectsStore.projects()`, `ProjectUserService.findByUserId(userId): Promise<ProjectUser[]>` (from `@services`).
- Produces (`store.access`):
  - signals: `memberships(): ProjectMemberships`, `platformAdmin(): boolean`, `logProjects(): Project[]`, `analyticsProjects(): Project[]`, `needsAnalyticsLanding(): boolean`
  - methods: `refresh(userId: string): Promise<ProjectMemberships>` (always refetches, shares an in-flight request), `can(projectId, permission): boolean`, `isLogRestricted(projectId): boolean` (member, not platform admin, cannot log), `clear()`

- [ ] **Step 1: Failing spec** (`project-access.store.spec.ts`): TestBed with providers `{ provide: ProjectUserService, useValue: { findByUserId } }`, `UserStore` / `ProjectsStore` replaced by stubs `{ user: signal(User) }`, `{ projects: signal([...]) }` (use `{ provide: UserStore, useValue }` style as in `home.page.spec.ts`). Cases: after `refresh('me')` with rows contributor(a)/viewer(b)/approver(c) → `logProjects` = [a], `analyticsProjects` = [b, c], `can('c','approve')` true, `can('b','approve')` false, `isLogRestricted('b')` true, `isLogRestricted('left-project')` false; platform admin → `analyticsProjects` = all, `isLogRestricted` false; two concurrent `refresh` calls call `findByUserId` once; `refresh` after a role change picks up the new role; `clear()` empties memberships.

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement**

```ts
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { UserRole } from '@models';
import { ProjectUserService } from '@services';
import {
  ProjectMemberships,
  ProjectPermissions,
  filterProjectsByPermission,
  needsAnalyticsLanding,
  resolveProjectPermissions,
  roleOf,
} from '@utils';

import { ProjectsStore } from './projects.store';
import { UserStore } from './user.store';

interface ProjectAccessState {
  memberships: ProjectMemberships;
}

export const ProjectAccessStore = signalStore(
  { providedIn: 'root' },
  withState<ProjectAccessState>({ memberships: {} }),
  withComputed(
    (store, user = inject(UserStore), projects = inject(ProjectsStore)) => {
      const platformAdmin = computed(() => user.user()?.role === UserRole.ADMIN);
      const projectsFor = (permission: keyof ProjectPermissions) =>
        computed(() =>
          filterProjectsByPermission(
            projects.projects(),
            store.memberships(),
            platformAdmin(),
            permission,
          ),
        );
      return {
        platformAdmin,
        logProjects: projectsFor('logTime'),
        analyticsProjects: projectsFor('viewAnalytics'),
        needsAnalyticsLanding: computed(() =>
          needsAnalyticsLanding(store.memberships(), platformAdmin()),
        ),
      };
    },
  ),
  withMethods((store, projectUsers = inject(ProjectUserService)) => {
    let inFlight: Promise<ProjectMemberships> | null = null;

    const permissionsFor = (projectId: string) =>
      resolveProjectPermissions(
        roleOf(store.memberships(), projectId),
        store.platformAdmin(),
      );

    return {
      can: (projectId: string, permission: keyof ProjectPermissions) =>
        permissionsFor(projectId)[permission],

      /** A member of the project whose role does not let them log time on it. */
      isLogRestricted: (projectId: string) =>
        roleOf(store.memberships(), projectId) !== undefined &&
        !store.platformAdmin() &&
        !permissionsFor(projectId).logTime,

      /** Always refetches so role changes apply without a re-login. */
      refresh(userId: string): Promise<ProjectMemberships> {
        inFlight ??= (async () => {
          try {
            const rows = await projectUsers.findByUserId(userId);
            const memberships = Object.fromEntries(
              rows.map((row) => [row.projectId, row.role as string]),
            );
            patchState(store, { memberships });
            return memberships;
          } finally {
            inFlight = null;
          }
        })();
        return inFlight;
      },

      clear: () => patchState(store, { memberships: {} }),
    };
  }),
);
```

Export from `state/index.ts`: `export * from './project-access.store';`.
In `store.ts`: add `public access = inject(ProjectAccessStore);` (import from `@state`) and change `init()` to

```ts
const user = this.user.user();
if (user) {
  await Promise.all([
    this.projects.fetchUserProjects(user),
    this.access.refresh(user.id),
  ]);
}
```

- [ ] **Step 4: Run spec, verify pass.**
- [ ] **Step 5: Commit** — `feat(access): project access store`

---

### Task 3: Guards and routes

**Files:**
- Create: `src/app/utils/log-time.guard.ts`, `src/app/utils/analytics.guard.ts` and specs
- Modify: `src/app/utils/index.ts`, `src/app/app.routes.ts`

**Interfaces:**
- Consumes: `Store.access.refresh`, `resolveProjectPermissions`, `roleOf`, `needsAnalyticsLanding`, `ToastService`, `appstraxAuth.getUser()` (`roles: string[]`, `id`).
- Produces: `LogTimeGuard.canActivate(): Promise<boolean>`; `AnalyticsGuard.canActivate(route: ActivatedRouteSnapshot): Promise<boolean>`.

Rules:
- `LogTimeGuard` (on `home`, `time-sheet`): `await access.refresh(authUser.id)`; deny + `router.navigate(['/analytics'])` only when `needsAnalyticsLanding`; otherwise allow. On error resolving the user, allow nothing: navigate `['']`.
- `AnalyticsGuard` (on `analytics` and `analytics/:projectId`): refresh; platform admin => allow. Without `projectId`: allow if any membership grants `viewAnalytics`. With `projectId`: allow if `resolveProjectPermissions(roleOf(m, projectId), false).viewAnalytics`. Deny => `toast.error('You do not have access to that project')` if a projectId was given, then navigate to `needsAnalyticsLanding ? '/analytics' : '/home'`. (A denied `/analytics` list request has no analytics access at all, so go to `/home`.)

- [ ] **Step 1: Failing specs** (both guards): stub `Store` (`{ access: { refresh: jasmine.createSpy().and.resolveTo(memberships) } }`), `Router` (`navigate` spy), `ToastService`, and `appstraxAuth.getUser` via `spyOn(appstraxAuth, 'getUser')`. Cases: contributor → LogTime allows; viewer-only → LogTime denies and navigates `/analytics`; no memberships → allows; Analytics: viewer allowed for own project, denied for contributor-only project with toast and navigation; platform admin allowed anywhere; `/analytics` list denied for contributor-only; refresh called on each activation.
- [ ] **Step 2: Run, verify fail.**
- [ ] **Step 3: Implement** both as `@Injectable({ providedIn: 'root' })` classes mirroring `AdminGuard` style, sharing one tiny private helper in a new `src/app/utils/access-context.util.ts`:

```ts
export async function loadAccessContext(store: Store): Promise<{
  memberships: ProjectMemberships;
  platformAdmin: boolean;
}> {
  const authUser = await appstraxAuth.getUser();
  const memberships = await store.access.refresh(authUser.id);
  return { memberships, platformAdmin: authUser.roles.includes(UserRole.ADMIN) };
}
```

Both guards call it (DRY). Routes: `home` and `time-sheet` get `canActivate: [LogTimeGuard]`; both `analytics` routes replace `AdminGuard` with `AnalyticsGuard`; `projects*` keep `AdminGuard`.

- [ ] **Step 4: Specs pass. Step 5: Commit** — `feat(access): log-time and analytics route guards`

---

### Task 4: Side navigation

**Files:** Modify `side-nav-expanded.component.ts` / `.html`; extend `side-nav` spec if present (else add `side-nav-expanded.component.spec.ts`).

- `ts`: inject `Store` (already). Add
  `showLogTime = computed(() => !this.store.access.needsAnalyticsLanding())` and
  `showAnalytics = computed(() => this.admin() || this.store.access.analyticsProjects().length > 0)`.
- `html`: wrap Home and Time Sheets links in `@if (showLogTime()) { … }`; change the Analytics link's guard to `@if (showAnalytics())` and move it out of the `@if (admin())` block; Projects stays under `@if (admin())`. Brand logo `routerLink="/home"` stays (the guard redirects).
- Tests: viewer-only shows Analytics but not Home/Time Sheets; contributor shows Home/Time Sheets but not Analytics; platform admin shows all four.
- Commit — `feat(access): role-aware side navigation`

---

### Task 5: Log-time surfaces (time sheet, entry modal, Home)

**Files:** `time-sheet.page.ts` (+spec), `time-sheet-entry.modal.ts` (+spec), `home.page.ts` (+spec), `time-sheet-project.util.ts` (+spec).

- `time-sheet.page.ts`: `myProjects = this.store.access.logProjects`; remove the `filterAssignedProjects` import. Hide restricted entries:
  `weekEntries` stays raw; in `filteredEntries` first drop `entry => this.store.access.isLogRestricted(entry.projectId)`.
- `time-sheet-entry.modal.ts`: `const assigned = this.store.access.logProjects();`, remove import.
- `home.page.ts`: `projects = computed(() => this.store.access.logProjects())`; delete the `UserRole`/`scopeProjectsToUser` imports and the old doc comment that explained admin scoping (rewrite: "Projects the user can log time on, including ones with no time logged yet.").
- `time-sheet-project.util.ts`: delete `filterAssignedProjects` and its describe block in the spec; keep the rest.
- Specs: add `access` to each `storeStub` (`{ logProjects: signal([...]), isLogRestricted: () => false }`). Add: time-sheet page hides entries for a restricted project and keeps entries on a left project; picker lists only contributor projects; Home totals ignore viewer-project entries.
- Commit — `feat(access): limit time sheet and Home to loggable projects`

---

### Task 6: Analytics surfaces and approval gating

**Files:** `analytics.page.ts` (+spec), `project-analytics.page.ts/.html` (+spec).

- `analytics.page.ts`: `projects = this.store.access.analyticsProjects` (replaces `this.store.projects.projects`). `fetchTimeSheetEntries` already uses `this.projects()` ids, so entries are scoped.
- `project-analytics.page.ts`:
  `public readonly canApprove = computed(() => this.store.access.can(this.projectId(), 'approve'));`
  In `setApproved`, `approveDay`, and the decline-day method (the handlers at lines ~282-300): first line `if (!this.canApprove()) return;`. Also guard `saveStatus` the same way (single choke point: put the check in `saveStatus` only and leave the callers — pick `saveStatus`, since all of them go through it).
- `project-analytics.page.html`: wrap every `status-action` approve/decline/approve-day button (lines ~119-225) in `@if (canApprove()) { … }` while keeping the status pill visible.
- Specs: viewer → no approve buttons, `setApproved` does not call `entryService.save`; approver → buttons shown and save called with only `approved` changed; platform admin → shown.
- Commit — `feat(access): gate analytics list and approve actions by role`

---

### Task 7: API — typed role and createEntry check

**Files (API repo, new branch `feat/user_roles` off `dev`):** `src/domain/models/project-user.ts`, `src/domain/services/project-user.service.ts`, `src/domain/services/time-sheet-entry.service.ts`, `src/__tests__/project-user.service.spec.ts`, `src/__tests__/time-sheet-entry.service.spec.ts`, README.

**Interfaces:**
- Produces: `export const PROJECT_ROLES = ['admin','contributor','viewer','approver'] as const; export type ProjectRole = (typeof PROJECT_ROLES)[number]; export function canLogTime(role: string): boolean` (contributor or admin) in `project-user.ts`; `ProjectUser.role: string` stays a string at runtime (data may be unrecognised) but is documented against `ProjectRole`.
- `ProjectUserDomainService.findRoleForProject(ctx, projectId): Promise<string | undefined>` reusing `findForCurrentUser`.

- [ ] **Step 1: Failing tests.** In the entry spec, extend `makeProjectDomainServiceStub` with a `projectUserDomainService` stub returning a role; add cases: viewer, approver, `''` and `'bogus'` roles each reject with `DomainError` status 403 *before* any DB call (`assert.equal(err.statusCode, 403)`); contributor and admin proceed to validation. Platform admins: mirror the frontend — `ctx.user.roles.includes('admin')` is allowed when a member (add test: role `viewer` + platform admin → allowed).
- [ ] **Step 2: Run `npm run build && npm test`, verify the new tests fail.**
- [ ] **Step 3: Implement.** `TimeSheetEntryDomainService` constructor gains `projectUserDomainService`; in `createEntry`, after `getProjectIfAccessible`:

```ts
const role = await this.projectUserDomainService.findRoleForProject(ctx, input.projectId);
if (!canCreateEntries(ctx, role)) {
  throw new DomainError('Your role on this project does not allow logging time', 403);
}
```

where `canCreateEntries(ctx, role)` = `role !== undefined && (canLogTime(role) || ctx.user.roles.includes('admin'))`. Update the construction site in `domain.module.ts` and existing test helpers to pass the new dependency.
- [ ] **Step 4: Tests + `npm run lint` pass. Step 5: Commit** — `feat: reject entry creation for viewer and approver roles`
- [ ] README: replace the "admins get no extra project visibility" role note with a short "Project roles" section stating which roles may create entries.

---

### Task 8: Verification and review

- [ ] Frontend: `npx ng test --watch=false --browsers=ChromeHeadless` (all green) and `npx ng build`.
- [ ] API: `npm run lint && npm run build && npm test`.
- [ ] Run the `code-review:code-review` skill on both branches at `high`; fix every finding; re-run until it reports clean.
- [ ] Pre-build gate from the spec (needs a real viewer account, which an agent can't create): confirm a non-admin viewer can read other users' entries and user names. Record the outcome in the PR description.
- [ ] Do **not** push or open PRs without the owner's go-ahead.

---

## Self-Review

- **Spec coverage:** roles/permissions (T1), mixed roles (T1, T5, T6), store (T2), guards/landing/stale access (T3: refresh on every guarded navigation), nav (T4), time sheet/Home/modal (T5), analytics + approver-only-`approved` (T6), MCP enforcement (T7), tests + gate (T8). Tab-focus refresh from the spec is dropped as YAGNI: every guarded navigation already refetches.
- **Spec deviation to note in the PR:** project-role `admin` grants log-time only (the spec's "viewer, approver or admin" for analytics meant platform admin).
- **Type consistency:** `ProjectMemberships`, `ProjectPermissions`, `resolveProjectPermissions`, `roleOf`, `filterProjectsByPermission`, `needsAnalyticsLanding`, `store.access.{refresh,can,isLogRestricted,logProjects,analyticsProjects,needsAnalyticsLanding}` are used identically in Tasks 3-6.
