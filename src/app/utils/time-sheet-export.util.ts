import { Injectable } from '@angular/core';

import {
  AnalyticsFilter,
  Project,
  ProjectField,
  TimeSheetEntry,
  User,
} from '@models';
import { getUserDisplayName } from './user-display.util';
import { TimeSheetDisplayUtil } from './time-sheet-display.util';

interface FieldColumn {
  key: string;
  label: string;
}

/**
 * Client-side CSV export for filtered analytics time entries.
 *
 * **Provisional mapping** — column order, headers, row granularity, date format,
 * and filename are placeholders until the Louden sample file is confirmed (TT-5).
 * Remap when that artefact arrives.
 *
 * **Date convention:** Each row uses the local calendar day via the caller's
 * `formatDate` (aligned with filter date inputs on the analytics panel). Summary,
 * Details, and Timeline views group days using UTC in places; an entry near
 * midnight may show a different day in those views than in this export.
 * Reconciling all sites is follow-up work, not handled here.
 *
 * **Custom fields:** Per-project exports append columns from that project's
 * `fields` config (in order), plus any `fieldValues` keys on entries not in config.
 * The all-projects export uses a union of field columns across rows.
 */
@Injectable({ providedIn: 'root' })
export class TimeSheetExportUtil {
  private static readonly BASE_HEADERS = [
    'User',
    'Date',
    'Hours',
    'Category',
    'Description',
    'Status',
  ];

  private static readonly BASE_HEADERS_WITH_PROJECT = [
    'Project',
    ...TimeSheetExportUtil.BASE_HEADERS,
  ];

  constructor(private readonly displayUtil: TimeSheetDisplayUtil) {}

  /**
   * Serialises all filtered entries and triggers a browser download.
   * Caller must guard empty `entries` (toast, no file).
   */
  exportFilteredEntries(
    entries: TimeSheetEntry[],
    projects: Project[],
    users: User[],
    filter: AnalyticsFilter,
    formatDate: (date?: Date) => string,
  ): void {
    const fieldColumns = this.collectFieldColumnsAcrossProjects(entries, projects);
    const headers = [
      ...TimeSheetExportUtil.BASE_HEADERS_WITH_PROJECT,
      ...fieldColumns.map((column) => column.label),
    ];
    const userMap = new Map(users.map((user) => [user.id, user]));
    const rows = entries.map((entry) =>
      this.entryToRow(entry, projects, userMap, formatDate, fieldColumns, {
        includeProject: true,
      }),
    );
    const csv = this.serialiseCsv(headers, rows);
    const filename = this.buildFilename(filter, formatDate);
    this.downloadCsv(csv, filename);
  }

  /**
   * Exports entries for a single project (filtered subset). Caller should toast
   * when the project has no entries in the current filter set.
   */
  exportProjectEntries(
    projectId: string,
    entries: TimeSheetEntry[],
    projects: Project[],
    users: User[],
    formatDate: (date?: Date) => string,
  ): void {
    const projectEntries = entries.filter((entry) => entry.projectId === projectId);
    if (!projectEntries.length) {
      return;
    }

    const project = projects.find((item) => item.id === projectId);
    const fieldColumns = this.buildFieldColumnsForProject(
      project,
      projectEntries,
    );
    const headers = [
      ...TimeSheetExportUtil.BASE_HEADERS,
      ...fieldColumns.map((column) => column.label),
    ];
    const userMap = new Map(users.map((user) => [user.id, user]));
    const rows = projectEntries.map((entry) =>
      this.entryToRow(entry, projects, userMap, formatDate, fieldColumns, {
        includeProject: false,
      }),
    );
    const csv = this.serialiseCsv(headers, rows);
    const filename = this.buildProjectFilename(project?.name, formatDate);
    this.downloadCsv(csv, filename);
  }

  private entryToRow(
    entry: TimeSheetEntry,
    projects: Project[],
    userMap: Map<string, User>,
    formatDate: (date?: Date) => string,
    fieldColumns: FieldColumn[],
    options: { includeProject: boolean },
  ): string[] {
    const user = userMap.get(entry.userId) ?? null;
    const entryDate = new Date(entry.date);
    const base = options.includeProject
      ? [
          this.displayUtil.getProjectName(entry.projectId, projects),
          getUserDisplayName(user),
          formatDate(entryDate),
          String(entry.hours),
          entry.category ?? '',
          entry.description ?? '',
          entry.approved ? 'Approved' : 'Pending',
        ]
      : [
          getUserDisplayName(user),
          formatDate(entryDate),
          String(entry.hours),
          entry.category ?? '',
          entry.description ?? '',
          entry.approved ? 'Approved' : 'Pending',
        ];

    const customValues = fieldColumns.map((column) =>
      this.getFieldValue(entry, column.key),
    );
    return [...base, ...customValues];
  }

  private getFieldValue(entry: TimeSheetEntry, key: string): string {
    const match = entry.fieldValues.find((field) => field.key === key);
    return match?.value ?? '';
  }

  private buildFieldColumnsForProject(
    project: Project | undefined,
    entries: TimeSheetEntry[],
  ): FieldColumn[] {
    const columns: FieldColumn[] = [];
    const seen = new Set<string>();

    for (const field of project?.fields ?? []) {
      if (seen.has(field.key)) continue;
      seen.add(field.key);
      columns.push({ key: field.key, label: field.label });
    }

    for (const entry of entries) {
      for (const fieldValue of entry.fieldValues) {
        if (seen.has(fieldValue.key)) continue;
        seen.add(fieldValue.key);
        const fromConfig = project?.fields?.find(
          (field) => field.key === fieldValue.key,
        );
        columns.push({
          key: fieldValue.key,
          label: fromConfig?.label ?? fieldValue.key,
        });
      }
    }

    return columns;
  }

  private collectFieldColumnsAcrossProjects(
    entries: TimeSheetEntry[],
    projects: Project[],
  ): FieldColumn[] {
    const projectMap = new Map(projects.map((project) => [project.id, project]));
    const columns: FieldColumn[] = [];
    const seen = new Set<string>();

    const addField = (field: ProjectField) => {
      if (seen.has(field.key)) return;
      seen.add(field.key);
      columns.push({ key: field.key, label: field.label });
    };

    const addKey = (key: string, project?: Project) => {
      if (seen.has(key)) return;
      seen.add(key);
      const fromConfig = project?.fields?.find((field) => field.key === key);
      columns.push({ key, label: fromConfig?.label ?? key });
    };

    for (const project of projects) {
      for (const field of project.fields ?? []) {
        addField(field);
      }
    }

    for (const entry of entries) {
      const project = projectMap.get(entry.projectId);
      for (const fieldValue of entry.fieldValues) {
        addKey(fieldValue.key, project);
      }
    }

    return columns;
  }

  private serialiseCsv(headers: string[], rows: string[][]): string {
    const headerLine = headers
      .map((field) => this.escapeCsvField(field))
      .join(',');
    const dataLines = rows.map((row) =>
      row.map((field) => this.escapeCsvField(field)).join(','),
    );
    const body = [headerLine, ...dataLines].join('\r\n');
    return `\uFEFF${body}`;
  }

  private escapeCsvField(value: string): string {
    const needsQuotes =
      value.includes(',') ||
      value.includes('"') ||
      value.includes('\n') ||
      value.includes('\r');
    if (!needsQuotes) {
      return value;
    }
    return `"${value.replace(/"/g, '""')}"`;
  }

  private buildFilename(
    _filter: AnalyticsFilter,
    formatDate: (date?: Date) => string,
  ): string {
    const today = formatDate(new Date());
    return `timesheet-export-${today}.csv`;
  }

  private buildProjectFilename(
    projectName: string | undefined,
    formatDate: (date?: Date) => string,
  ): string {
    const today = formatDate(new Date());
    const slug = this.sanitizeFilename(projectName ?? 'project');
    return `${slug}-timesheet-export-${today}.csv`;
  }

  private sanitizeFilename(value: string): string {
    const trimmed = value.trim() || 'project';
    return trimmed
      .replace(/[/\\?%*:|"<>]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
  }

  private downloadCsv(csv: string, filename: string): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }
}
