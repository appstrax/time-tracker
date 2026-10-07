# TT-54: Project role permissions (Contributor, Viewer, Approver, Admin)

## Goal

Give the four project roles meaningful, distinct permissions. Contributor and
admin experiences stay as they are today. Viewers and approvers get read-only
(viewer) and read + restricted update (approver) access to analytics for the
projects they are assigned to, and no access to the time sheet.

## Background

- `ProjectUserRole` (`admin | viewer | contributor | approver`) is stored on the
  `project-users` row but nothing reads it to allow or deny anything.
- `UserRole` (`admin | user`) is the platform role. It currently drives every
  real restriction: `AdminGuard` on `/projects` and `/analytics`, side nav items,
  and which projects the store loads.
- The frontend writes straight to appstrax-services collections. The MCP API
  (separate repo) is a second write path. Collection rules cannot be changed by
  this team.
- `TimeSheetEntry` has only `approved: boolean`. "Decline" means undoing an
  approval. There is no declined state and no resubmit flow.

## Scope and enforcement limit

Enforcement is **UI-level in this frontend plus real server checks on the
MCP/API path**. A user who calls the appstrax-services collections directly
with their own token is not blocked by this work. Acceptance criteria are
worded "through the app and MCP" accordingly. A server layer that mediates
collection access is out of scope and would be a separate ticket.

## Permission model

Roles are per project. A project role is never a global user role. Platform
admin short-circuits every check to "allowed".

| Action within a project | Contributor | Viewer | Approver | Admin |
|---|---|---|---|---|
| Home / own-time experience | Yes | No | No | Existing |
| Create own time entries | Yes | No | No | Yes (member projects) |
| Edit/delete own entries | Existing rules | No | No | Existing |
| View project analytics and other users' entries | No | Yes | Yes | Yes |
| Approve / undo approval | No | No | Yes | Yes |
| Change entry content | No | No | No | Existing |
| Manage project settings and members | No | No | No | Yes |

- Platform admin keeps today's scope. The project-level `admin` role stays a
  label with no extra power, as today.
- Approver "update" means flipping `approved` only.
- Approvers may approve their own entries (assumed; see Open items).
- Unknown or missing roles grant **no** access. Never default to contributor.

### Mixed roles

A user can hold different roles on different projects, and each check is for the
selected project. Example: contributor on A, viewer on B, approver on C.

- Time sheet, Home and the log-time picker show **only A**.
- Analytics shows B and C. Approve controls show on C only.
- A viewer-project's historic entries by the same user stay in the data, are
  hidden from their time sheet and Home, and appear in that project's analytics.

## Design

### 1. `ProjectAccessStore` (`@state`)

Loaded alongside the projects store from the user's `project-users` rows
(`ProjectUserService.findByUserId`; the role is currently discarded by
`ProjectService.findByUserId`). Holds `projectId -> role`.

Questions it exposes (pure role logic in one function, unit-testable without
Angular):

- `canLogTime(projectId)`: contributor or admin
- `canViewAnalytics(projectId)`: viewer, approver or admin
- `canApprove(projectId)`: approver or admin
- `logProjects()`, `analyticsProjects()`: the project lists those imply
- `hasLogAccess()`, `hasAnalyticsAccess()`: for navigation and guards

### 2. Routes, navigation, landing

- `/home`, `/time-sheet`: new `LogTimeGuard`. Allows platform admins and anyone
  with `hasLogAccess()`.
- `/analytics`: `AnalyticsGuard` requires `hasAnalyticsAccess()` (or platform
  admin).
- `/analytics/:projectId`: `AnalyticsGuard` requires
  `canViewAnalytics(projectId)`. A direct link to an unassigned project
  redirects to the user's landing page with a toast.
- `/projects`, `/projects/project`: unchanged, platform-admin only.
- Side nav: Home and Time sheet for log access, Analytics for analytics access,
  Projects and other admin items for admins.
- Landing after login: viewer-only and approver-only users go to `/analytics`;
  everyone else to `/home`, as today.
- Stale access: reload the access store on navigation into a guarded route and
  on tab focus, so role changes and removals apply without logging out.

### 3. Screens

- **Time sheet and entry modal:** project picker uses `logProjects()`. For
  platform admins this is still the projects they belong to (existing
  `filterAssignedProjects` behaviour). Entries on projects the user cannot log
  to are not shown.
- **Analytics list and project page:** only `analyticsProjects()`. Viewers and
  approvers use the same page, read-only. Approve, decline and approve-day
  buttons render only when `canApprove(projectId)`; `setApproved` and
  `saveStatus` also check, as a second guard.
- **Approver update:** the only mutation exposed is toggling `approved` via the
  existing `setApproved`. No other entry editing is reachable from analytics.
- **Member management:** unchanged, admin-only.

### 4. MCP/API (separate repo, follow-on)

`ProjectUser.role` becomes a typed enum and `createEntry` rejects any role other
than contributor or admin with a 403 `DomainError`. This is real server
enforcement and is tracked in the API repo.

## Pre-build verification (gate)

Viewer and approver analytics depend on two reads that this team cannot
configure. Before implementing, verify with a real viewer-role account:

1. A non-admin can read other users' time entries for a project they are a
   member of (`TimeSheetEntryService.findByProjectId`).
2. A non-admin can resolve other users' names
   (`UsersService.findByUserIds`; `ProjectService.populateProjectUsers` returns
   `[]` for non-admins today).

If either is blocked by the collections, stop and report. No frontend change
fixes that; it needs a server layer or an appstrax-services change.

## Testing

- `ProjectAccessStore` role matrix: each role, unknown/missing role, mixed-role
  user, platform admin short-circuit.
- `LogTimeGuard` and `AnalyticsGuard`: allowed, denied, direct link to
  unassigned project, redirect target.
- Components: approve buttons only for approver/admin, project pickers, side nav
  items per role, landing redirect.
- Contributor and admin regression: existing specs stay green.

## Acceptance criteria

- Contributors keep their current experience.
- Viewers see assigned-project analytics through the app and cannot create,
  edit, delete or approve entries.
- Approvers see assigned-project analytics and can approve/undo approval only.
- Admin functionality is unchanged.
- Mixed-role users get permissions per project.
- Changing a role or removing membership updates access without logging out.
- Existing entries remain intact when their owner's role changes.
- MCP `create_entry` rejects non-contributor/non-admin members.
- The limit is documented: direct collection access with a token is not blocked.

## Open items

- Approvers approving their own entries is allowed. Confirm or block.
- "Decline" remains "undo approval"; no declined/resubmit state is introduced.
- Whether platform admins can edit other users' entry content is "preserve
  existing"; confirm during implementation what exists today.
