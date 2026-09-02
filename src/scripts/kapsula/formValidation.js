import * as z from "zod/mini";

const capsuleSchemaCache = new WeakMap();

function buildSectionSchema(section) {
  if (section.type === "calendar") {
    return section.required
      ? z.object({
        from: z.string().check(z.trim(), z.minLength(1)),
        to: z.string().check(z.trim(), z.minLength(1)),
      })
      : z.object({
        from: z.string(),
        to: z.string(),
      });
  }

  if (section.multiple) {
    return section.required
      ? z.array(z.string()).check(z.minLength(1))
      : z.array(z.string());
  }

  return section.required
    ? z.string().check(z.trim(), z.minLength(1))
    : z.string().check(z.trim());
}

function buildCapsuleSchema(schema) {
  return z.object(
    schema.sections.reduce((shape, section) => {
      shape[section.id] = buildSectionSchema(section);
      return shape;
    }, {}),
  );
}

export function validateSchema(schema, values) {
  let validationSchema = capsuleSchemaCache.get(schema);

  if (!validationSchema) {
    validationSchema = buildCapsuleSchema(schema);
    capsuleSchemaCache.set(schema, validationSchema);
  }

  const result = validationSchema.safeParse(values);

  console.log('[ZOD VALUES]', values);
  console.log('[ZOD RESULT]', result);

  if (!result.success) {
    console.log('[ZOD ERRORS]', result.error.issues);
  }

  return result;
}
