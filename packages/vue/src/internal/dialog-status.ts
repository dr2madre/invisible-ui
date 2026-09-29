import { onScopeDispose, shallowReadonly, shallowRef, type Ref, type ShallowRef } from "vue";
import type { FeedbackStatus } from "../feedback-icon/FeedbackIcon";

/** The button a dialog notice offers, such as Retry after a failed upload. */
export interface DialogNoticeAction {
  label: string;
  /** Runs when the button is pressed; the notice then closes. */
  onAction: () => void;
}

/** A message about the dialog's own task, shown in its status area (ADR 0016). */
export interface DialogNoticeOptions {
  /** `info` by default. */
  status?: FeedbackStatus;
  title: string;
  description?: string;
  action?: DialogNoticeAction;
  /** Whether the notice has a close button. Defaults to `true`. */
  dismissible?: boolean;
}

/** A notice in the status area, with its id and resolved defaults. */
export interface DialogNotice {
  id: string;
  status: FeedbackStatus;
  title: string;
  description?: string;
  action?: DialogNoticeAction;
  dismissible: boolean;
}

/**
 * The methods every dialog in the family exposes on its template ref, and
 * `useDialog` returns: type a ref with it to call them.
 */
export interface DialogNoticeControls {
  /** Show a notice in the status area and return its id; `""` while closed. */
  notify: (options: DialogNoticeOptions) => string;
  /** Remove one notice from the status area. */
  dismissNotice: (id: string) => void;
  /** Remove every notice from the status area. */
  clearNotices: () => void;
}

export interface DialogStatus extends DialogNoticeControls {
  /** The notices to render, oldest first. */
  notices: Readonly<ShallowRef<readonly DialogNotice[]>>;
  /** What the live region reads right now: one line per title or description. */
  announcement: Readonly<ShallowRef<readonly string[]>>;
}

const STATUSES: FeedbackStatus[] = ["info", "success", "warning", "danger", "neutral"];
// Text written right after a live region empties is announced more reliably.
const ANNOUNCE_DELAY = 100;

/**
 * The state of a dialog's status area (internal, ADR 0016): notices about the
 * dialog's own task and the text of one persistent polite live region that
 * announces each notice once, when it is added. `dialogStatus()` renders both.
 *
 * Notices belong to one opening of the dialog: `notify()` while the panel is
 * not open shows nothing, and the dialog calls `clearNotices()` when it
 * closes.
 */
export function useDialogStatus(
  idPrefix: string,
  panel: Ref<HTMLDialogElement | null>,
): DialogStatus {
  const notices = shallowRef<readonly DialogNotice[]>([]);
  const announcement = shallowRef<readonly string[]>([]);
  let counter = 0;
  let pending: { id: string; lines: string[] }[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;

  const announce = (id: string, lines: string[]) => {
    pending.push({ id, lines });
    if (timer !== undefined) return;
    // Emptied first, so the same text twice is still a change.
    announcement.value = [];
    timer = setTimeout(() => {
      timer = undefined;
      const next = pending.flatMap((entry) => entry.lines);
      pending = [];
      if (next.length) announcement.value = next;
    }, ANNOUNCE_DELAY);
  };

  const notify = (options: DialogNoticeOptions): string => {
    if (!panel.value?.open) return "";
    const id = `${idPrefix}-notice-${++counter}`;
    const status = STATUSES.includes(options.status as FeedbackStatus)
      ? (options.status as FeedbackStatus)
      : "info";
    notices.value = [
      ...notices.value,
      {
        id,
        status,
        title: options.title,
        description: options.description,
        action: options.action,
        dismissible: options.dismissible !== false,
      },
    ];
    announce(id, [options.title, options.description ?? ""].filter(Boolean));
    return id;
  };

  const dismissNotice = (id: string) => {
    if (!notices.value.some((notice) => notice.id === id)) return;
    pending = pending.filter((entry) => entry.id !== id);
    // Removing the element that holds focus would drop focus to the page:
    // the panel takes it, the way it does when the dialog opens.
    const element = panel.value?.ownerDocument.getElementById(id);
    if (element?.contains(element.ownerDocument.activeElement)) panel.value?.focus();
    notices.value = notices.value.filter((notice) => notice.id !== id);
  };

  const clearNotices = () => {
    notices.value = [];
    clearTimeout(timer);
    timer = undefined;
    pending = [];
    announcement.value = [];
  };

  onScopeDispose(() => clearTimeout(timer));

  return {
    notices: shallowReadonly(notices),
    announcement: shallowReadonly(announcement),
    notify,
    dismissNotice,
    clearNotices,
  };
}
