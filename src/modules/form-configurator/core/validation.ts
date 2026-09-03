import * as z from "zod/mini";
import {getFieldTypeDefinition} from "./fieldTypes.ts";
import type {CapsuleConfig, FieldConfig, FormValues, ValidationResult} from "./types.ts";

const capsuleSchemaCache = new WeakMap<CapsuleConfig, z.ZodMiniType<FormValues>>();

function buildSectionSchema(section: FieldConfig) {
  return getFieldTypeDefinition(section).createValidationSchema(section);
}

function buildCapsuleSchema(capsule: CapsuleConfig): z.ZodMiniType<FormValues> {
  const shape = capsule.sections.reduce<Record<string, ReturnType<typeof buildSectionSchema>>>(
    (schema, section) => {
      schema[section.id] = buildSectionSchema(section);
      return schema;
    },
    {},
  );

  return z.object(shape) as z.ZodMiniType<FormValues>;
}

export function validateFormValues(
  capsule: CapsuleConfig,
  values: Readonly<FormValues>,
): ValidationResult {
  let validationSchema = capsuleSchemaCache.get(capsule);
  if (!validationSchema) {
    validationSchema = buildCapsuleSchema(capsule);
    capsuleSchemaCache.set(capsule, validationSchema);
  }

  return validationSchema.safeParse(values) as ValidationResult;
}
