import type {FieldConfig} from "../core/types.ts";
import type {FieldRenderer} from "./renderer.ts";

export interface FieldRendererRegistry {
  register<TField extends FieldConfig>(renderer: FieldRenderer<TField>): void;
  get<TField extends FieldConfig>(type: TField["type"]): FieldRenderer<TField>;
}

export function createFieldRendererRegistry(
  renderers: readonly FieldRenderer[] = [],
): FieldRendererRegistry {
  const registered = new Map<string, FieldRenderer>();
  const register: FieldRendererRegistry["register"] = (renderer) => {
    if (registered.has(renderer.type)) {
      throw new Error(`Field renderer "${renderer.type}" is already registered`);
    }
    registered.set(renderer.type, renderer);
  };
  function get<TField extends FieldConfig>(type: TField["type"]): FieldRenderer<TField> {
    const renderer = registered.get(type);
    if (!renderer) throw new Error(`Unknown field renderer: ${type}`);
    return renderer as FieldRenderer<TField>;
  }
  const registry: FieldRendererRegistry = {
    register,
    get,
  };

  renderers.forEach((renderer) => registry.register(renderer));
  return registry;
}
