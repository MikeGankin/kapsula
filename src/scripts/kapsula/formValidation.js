import {z} from "zod";

const capsuleSchemaCache = new WeakMap();

function buildSectionSchema(section) {
  if (section.multiple) {
    const schema = z.array(z.string());
    return section.required ? schema.min(1) : schema;
  }

  if (section.type === "textarea") {
    const schema = z.string().trim();
    return section.required ? schema.min(1) : schema;
  }

  const schema = z.string().trim();
  return section.required ? schema.min(1) : schema;
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

  return validationSchema.safeParse(values);
}
