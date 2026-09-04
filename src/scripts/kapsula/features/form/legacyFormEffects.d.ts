import type {ExpandedState, FormValues} from "../../../../modules/form-configurator/core/types.ts";

export interface ResponsiveImageSources {
  desktopSrc: string;
  mobileSrc: string | null;
}

export interface OverlayLayer {
  sectionId: string;
  animation?: "segments" | "single";
  availableSources: string[];
  selectedSources: string[];
}

export interface OverlayOptions {
  layers?: OverlayLayer[];
}

export type AnimateFormSections = (
  formNode: HTMLElement,
  expandedState: ExpandedState,
  previousExpandedState: ExpandedState,
  values: FormValues,
  previousValues: FormValues,
) => void;
