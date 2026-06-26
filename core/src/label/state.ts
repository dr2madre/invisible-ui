import type { LabelContext, LabelState } from "./types";

/** Build the initial state from user context. */
export function initialState(context: LabelContext = {}): LabelState {
  return {
    for: context.for ?? null,
    id: context.id ?? null,
  };
}
