import {debounceTime, distinctUntilChanged, map, type Observable, type Subscription} from "rxjs";
import {serializeFormValues} from "../core/serialization.ts";
import type {CapsuleConfig, FormState, FormValues} from "../core/types.ts";

interface BindFormPersistenceOptions {
  getSnapshot(): FormState;
  getCapsule(state: FormState): CapsuleConfig;
  saveFormValues(capsuleId: string, values: Readonly<FormValues>): void;
  windowNode?: Window;
  documentNode?: Document;
}

export function bindFormPersistence(
  state$: Observable<FormState>,
  options: BindFormPersistenceOptions,
): () => void {
  const windowNode = options.windowNode ?? window;
  const documentNode = options.documentNode ?? document;
  const persist = () => {
    const state = options.getSnapshot();
    options.saveFormValues(
      state.capsuleId,
      serializeFormValues(options.getCapsule(state).sections, state.values),
    );
  };
  const subscription: Subscription = state$.pipe(
    map((state) => ({capsuleId: state.capsuleId, values: state.values})),
    distinctUntilChanged((previous, current) => (
      previous.capsuleId === current.capsuleId && previous.values === current.values
    )),
    debounceTime(150),
  ).subscribe(persist);
  const onPageHide = () => persist();
  const onVisibilityChange = () => {
    if (documentNode.visibilityState === "hidden") persist();
  };
  windowNode.addEventListener("pagehide", onPageHide);
  documentNode.addEventListener("visibilitychange", onVisibilityChange);
  let bound = true;
  return () => {
    if (!bound) return;
    bound = false;
    subscription.unsubscribe();
    windowNode.removeEventListener("pagehide", onPageHide);
    documentNode.removeEventListener("visibilitychange", onVisibilityChange);
  };
}
