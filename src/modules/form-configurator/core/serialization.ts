import {getFieldTypeDefinition} from "./fieldTypes.ts";
import type {FieldConfig, FormValues} from "./types.ts";

export function serializeFormValues(
  sections: readonly FieldConfig[],
  values: Readonly<FormValues>,
): FormValues {
  return sections.reduce<FormValues>((serialized, field) => {
    const value = getFieldTypeDefinition(field).serializeValue(field, values[field.id]);
    if (value !== undefined) serialized[field.id] = value;
    return serialized;
  }, {});
}
