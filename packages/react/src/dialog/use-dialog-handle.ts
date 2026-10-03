import { useImperativeHandle, type Ref } from "react";
import type { DialogNoticeOptions, DialogNotices } from "./use-dialog-notices";

/**
 * What a ref on a dialog of the family holds: the status area (ADR 0016), for
 * messages about the dialog's own task.
 */
export interface DialogHandle {
  /** Show a notice and return its id; an empty string while the dialog is closed. */
  notify: (options: DialogNoticeOptions) => string;
  /** Remove one notice. */
  dismissNotice: (id: string) => void;
  /** Remove every notice. */
  clearNotices: () => void;
}

/**
 * Hand a dialog's status area to the ref its consumer passed (internal). Every
 * dialog of the family exposes the same three functions.
 */
export function useDialogHandle(
  ref: Ref<DialogHandle> | undefined,
  { notify, dismissNotice, clearNotices }: Pick<DialogNotices, keyof DialogHandle>,
): void {
  useImperativeHandle(ref, () => ({ notify, dismissNotice, clearNotices }), [
    notify,
    dismissNotice,
    clearNotices,
  ]);
}
