export interface ConditionRule {
  includes?: string[];
  excludes?: string[];
}

export type FieldConditions = Record<string, ConditionRule>;

export interface FieldOption {
  value: string;
  label: string;
  description?: string;
  visibleWhen?: FieldConditions;
  hiddenWhen?: FieldConditions;
  overlayImageSrc?: string;
  [key: string]: unknown;
}

export interface BaseFieldConfig {
  id: string;
  type: string;
  title: string;
  render: boolean;
  subtitle?: string;
  required?: boolean;
  expanded?: boolean;
  placeholder?: string;
  [key: string]: unknown;
}

export interface CardsFieldConfig extends BaseFieldConfig {
  type: "cards";
  options: FieldOption[];
  multiple?: boolean;
  overlayAnimation?: "segments" | "single";
}

export interface TextareaFieldConfig extends BaseFieldConfig {
  type: "textarea";
}

export interface TextFieldConfig extends BaseFieldConfig {
  type: "text";
}

export interface CalendarSettings {
  mode?: "single" | "multiple" | "range" | "time";
  minDate?: string;
  maxDate?: string;
  dateFormat?: string;
  [key: string]: unknown;
}

export interface CalendarFieldConfig extends BaseFieldConfig {
  type: "calendar";
  calendar?: CalendarSettings;
}

export type FieldConfig =
  | CardsFieldConfig
  | TextareaFieldConfig
  | TextFieldConfig
  | CalendarFieldConfig;

export interface CalendarValue {
  from: string;
  to: string;
}

export type FieldValue = string | string[] | CalendarValue | null;
export type FormValues = Record<string, FieldValue>;
export type ExpandedState = Record<string, boolean>;
export type TouchedSections = Record<string, boolean>;

export interface CapsuleConfig {
  title: string;
  subtitle: string;
  imageSrc: string;
  imageMobileSrc: string;
  imageAlt: string;
  submitLabel: string;
  sections: FieldConfig[];
  [key: string]: unknown;
}

export type FormVariant = CapsuleConfig;

export interface FormState {
  capsuleId: string;
  values: FormValues;
  expandedState: ExpandedState;
  activeSectionId: string | null;
  touchedSections: TouchedSections;
}

export interface CreateFormStateOptions {
  savedValues?: Readonly<FormValues>;
  savedActiveSectionId?: string | null;
}

export interface ValidationIssue {
  path: PropertyKey[];
  message: string;
  [key: string]: unknown;
}

export type ValidationResult =
  | {success: true; data: FormValues}
  | {success: false; error: {issues: ValidationIssue[]}};

export interface FormConfig {
  capsules: Record<string, CapsuleConfig>;
  defaultCapsule?: string;
  [key: string]: unknown;
}
