import * as z from "zod/mini";

import type {FormConfig} from "./types.ts";

const nonEmptyString = z.string().check(z.trim(), z.minLength(1));

const conditionRuleSchema = z.looseObject({
  includes: z.optional(z.array(z.string())),
  excludes: z.optional(z.array(z.string())),
});

const fieldConditionsSchema = z.record(z.string(), conditionRuleSchema);

const fieldOptionSchema = z.looseObject({
  value: z.string(),
  label: z.string(),
  description: z.optional(z.string()),
  visibleWhen: z.optional(fieldConditionsSchema),
  hiddenWhen: z.optional(fieldConditionsSchema),
  overlayImageSrc: z.optional(z.string()),
});

const baseFieldShape = {
  id: nonEmptyString,
  title: nonEmptyString,
  render: z.boolean(),
  subtitle: z.optional(z.string()),
  required: z.optional(z.boolean()),
  expanded: z.optional(z.boolean()),
  placeholder: z.optional(z.string()),
};

const fieldSchema = z.discriminatedUnion("type", [
  z.looseObject({
    ...baseFieldShape,
    type: z.literal("cards"),
    options: z.array(fieldOptionSchema),
    multiple: z.optional(z.boolean()),
  }),
  z.looseObject({...baseFieldShape, type: z.literal("textarea")}),
  z.looseObject({...baseFieldShape, type: z.literal("text")}),
  z.looseObject({
    ...baseFieldShape,
    type: z.literal("calendar"),
    calendar: z.optional(z.looseObject({
      mode: z.optional(z.string()),
      minDate: z.optional(z.string()),
      maxDate: z.optional(z.string()),
      dateFormat: z.optional(z.string()),
    })),
  }),
]);

const capsuleSchema = z.looseObject({
  title: z.string(),
  subtitle: z.string(),
  imageSrc: z.string(),
  imageMobileSrc: z.string(),
  imageAlt: z.string(),
  submitLabel: z.string(),
  sections: z.array(fieldSchema),
});

const formConfigSchema = z.looseObject({
  capsules: z.record(z.string(), capsuleSchema),
  defaultCapsule: z.optional(z.string()),
});

export function parseFormConfig(input: unknown): FormConfig {
  return z.parse(formConfigSchema, input) as FormConfig;
}
