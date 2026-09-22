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
