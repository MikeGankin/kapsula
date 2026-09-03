import * as z from "zod/mini";

import {getVisibleOptions} from "./conditions.ts";
import type {
  BaseFieldConfig,
  CalendarFieldConfig,
  CardsFieldConfig,
  FieldConfig,
  FieldValue,
  FormValues,
  TextareaFieldConfig,
  TextFieldConfig,
} from "./types.ts";

export interface FieldTypeContext {
  values: Readonly<FormValues>;
}

export interface FieldTypeDefinition<TField extends BaseFieldConfig = BaseFieldConfig> {
  readonly type: TField["type"] | string;
  getInitialValue(field: TField, saved: FieldValue | undefined): FieldValue;
  normalizeValue(
    field: TField,
    value: FieldValue | undefined,
    context: FieldTypeContext,
  ): FieldValue;
  createValidationSchema(field: TField): z.ZodMiniType;
  serializeValue(field: TField, value: FieldValue | undefined): FieldValue | undefined;
  summarizeValue(
    field: TField,
    value: FieldValue | undefined,
    context: FieldTypeContext,
  ): string;
}

export interface FieldTypeRegistry {
  register<TField extends BaseFieldConfig>(definition: FieldTypeDefinition<TField>): void;
  get(type: string): FieldTypeDefinition;
}

function asStoredDefinition<TField extends BaseFieldConfig>(
  definition: FieldTypeDefinition<TField>,
): FieldTypeDefinition {
  return definition as FieldTypeDefinition;
}

export function createFieldTypeRegistry(
  definitions: readonly FieldTypeDefinition[] = [],
): FieldTypeRegistry {
  const registeredDefinitions = new Map<string, FieldTypeDefinition>();

  const registry: FieldTypeRegistry = {
    register(definition) {
      if (registeredDefinitions.has(definition.type)) {
        throw new Error(`Field type "${definition.type}" is already registered`);
      }
      registeredDefinitions.set(definition.type, asStoredDefinition(definition));
    },
    get(type) {
      const definition = registeredDefinitions.get(type);
      if (!definition) throw new Error(`Unknown field type: ${type}`);
      return definition;
    },
  };

  definitions.forEach((definition) => registry.register(definition));
  return registry;
}

function requiredStringSchema(required: boolean | undefined): z.ZodMiniType {
  return required
    ? z.string().check(z.trim(), z.minLength(1))
    : z.string().check(z.trim());
}

function formatCalendarDate(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}.${month}.${year}`;
}

const cardsDefinition: FieldTypeDefinition<CardsFieldConfig> = {
  type: "cards",
  getInitialValue(field, saved) {
    const knownValues = new Set(field.options.map((option) => option.value));
    if (field.multiple) {
      return Array.isArray(saved) ? saved.filter((value) => knownValues.has(value)) : [];
    }
    return typeof saved === "string" && knownValues.has(saved) ? saved : "";
  },
  normalizeValue(field, value, context) {
    const visibleValues = getVisibleOptions(field, context.values).map((option) => option.value);
    if (field.multiple) {
      return Array.isArray(value)
        ? value.filter((optionValue) => visibleValues.includes(optionValue))
        : [];
    }
    if (Array.isArray(value)) {
      return value.find((optionValue) => visibleValues.includes(optionValue)) ?? "";
    }
    return typeof value === "string" && visibleValues.includes(value) ? value : "";
  },
  createValidationSchema(field) {
    if (field.multiple) {
      return field.required
        ? z.array(z.string()).check(z.minLength(1))
        : z.array(z.string());
    }
    return requiredStringSchema(field.required);
  },
  serializeValue(field, value) {
    return value ?? (field.multiple ? [] : "");
  },
  summarizeValue(field, value, context) {
    const selectedValues = Array.isArray(value) ? value : [value].filter(Boolean);
    const labels = getVisibleOptions(field, context.values)
      .filter((option) => selectedValues.includes(option.value))
      .map((option) => option.label);
    if (labels.length > 0) return labels.join(", ");
    if (Array.isArray(value)) return value.filter(Boolean).join(", ");
    return typeof value === "string" ? value : "";
  },
};

const textareaDefinition: FieldTypeDefinition<TextareaFieldConfig> = {
  type: "textarea",
  getInitialValue: (_field, saved) => typeof saved === "string" ? saved : "",
  normalizeValue: (_field, value) => typeof value === "string" ? value : "",
  createValidationSchema: (field) => requiredStringSchema(field.required),
  serializeValue: () => undefined,
  summarizeValue: () => "",
};

const textDefinition: FieldTypeDefinition<TextFieldConfig> = {
  type: "text",
  getInitialValue: (_field, saved) => typeof saved === "string" ? saved : "",
  normalizeValue: (_field, value) => typeof value === "string" ? value : "",
  createValidationSchema: (field) => requiredStringSchema(field.required),
  serializeValue: (_field, value) => typeof value === "string" ? value : "",
  summarizeValue: (_field, value) => typeof value === "string" ? value : "",
};

const calendarDefinition: FieldTypeDefinition<CalendarFieldConfig> = {
  type: "calendar",
  getInitialValue: (_field, saved) => saved ?? {from: "", to: ""},
  normalizeValue: (_field, value) => value ?? null,
  createValidationSchema(field) {
    return field.required
      ? z.object({
        from: z.string().check(z.trim(), z.minLength(1)),
        to: z.string().check(z.trim(), z.minLength(1)),
      })
      : z.object({from: z.string(), to: z.string()});
  },
  serializeValue: (_field, value) => value ?? "",
  summarizeValue(_field, value) {
    if (!value || typeof value !== "object" || Array.isArray(value) || !value.from) return "";
    if (!value.to || value.from === value.to) return value.from;
    return `${formatCalendarDate(value.from)} — ${formatCalendarDate(value.to)}`;
  },
};

const builtInFieldTypes: readonly FieldTypeDefinition[] = [
  asStoredDefinition(cardsDefinition),
  asStoredDefinition(textareaDefinition),
  asStoredDefinition(textDefinition),
  asStoredDefinition(calendarDefinition),
];
const builtInRegistry = createFieldTypeRegistry(builtInFieldTypes);

export function getFieldTypeDefinition(field: FieldConfig): FieldTypeDefinition {
  return builtInRegistry.get(field.type);
}

export function summarizeFieldValue(
  field: FieldConfig,
  value: FieldValue | undefined,
  values: Readonly<FormValues>,
): string {
  return getFieldTypeDefinition(field).summarizeValue(field, value, {values});
}
