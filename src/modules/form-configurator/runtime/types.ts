import type {
  CapsuleConfig,
  FormValues,
  ValidationResult,
} from "../core/types.ts";

export interface FormSnapshot {
  capsuleId: string;
  capsule: CapsuleConfig;
  values: FormValues;
}

export interface FormCommands {
  getSnapshot(): FormSnapshot;
  validate(): ValidationResult;
  showValidationErrors(result: ValidationResult): void;
  setCapsule(capsuleId: string): boolean;
  prepareCapsule(capsuleId: string): Promise<boolean>;
}

export interface FormLifecycleHandle {
  destroy(): void;
}

export type FormExperience = FormCommands & FormLifecycleHandle;
