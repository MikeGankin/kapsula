import type {
  FieldConfig,
  FieldValue,
  FormState,
  FormValues,
} from "../core/types.ts";

export type UpdateFormState = (updater: (state: FormState) => FormState) => void;

export interface FieldRenderContext {
  values: Readonly<FormValues>;
  updateState?: UpdateFormState;
}

export interface FieldRenderHandle {
  readonly node: HTMLElement;
  sync(value: FieldValue | undefined, context: FieldRenderContext): void;
  destroy(): void;
}

export interface FieldRenderer<TField extends FieldConfig = FieldConfig> {
  readonly type: TField["type"];
  render(
    field: TField,
    value: FieldValue | undefined,
    context: FieldRenderContext,
  ): FieldRenderHandle;
}

export type FieldRendererContext = FieldRenderContext;
