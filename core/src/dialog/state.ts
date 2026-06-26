import type { DialogContext, DialogState } from "./types";

let idCounter = 0;

/** Build the initial state from user context. */
export function initialState(context: DialogContext = {}): DialogState {
  return {
    open: context.open ?? false,
    id: context.id ?? `ds-dialog-${++idCounter}`,
    role: context.role ?? "dialog",
  };
}

/** Id of the trigger element. */
export const triggerId = (baseId: string) => `${baseId}-trigger`;
/** Id of the dialog panel. */
export const contentId = (baseId: string) => `${baseId}-content`;
/** Id of the title element (names the dialog). */
export const titleId = (baseId: string) => `${baseId}-title`;
/** Id of the description element (describes the dialog). */
export const descriptionId = (baseId: string) => `${baseId}-description`;
