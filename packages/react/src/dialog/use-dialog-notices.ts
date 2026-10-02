import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

/** The status a dialog notice shows, as in an Inline Notification. */
export type DialogNoticeStatus = "info" | "success" | "warning" | "danger" | "neutral";

/** The button a dialog notice offers, such as Retry after a failed upload. */
export interface DialogNoticeAction {
  label: string;
  /** Runs when the button is pressed; the notice then closes. */
  onAction: () => void;
}

/** A message about the dialog's own task, shown in its status area (ADR 0016). */
export interface DialogNoticeOptions {
  /** `info` by default. */
  status?: DialogNoticeStatus;
  title: string;
  description?: string;
  action?: DialogNoticeAction;
  /** Whether the notice has a close button. Defaults to `true`. */
  dismissible?: boolean;
}

/** A notice in the status area, as `notify()` recorded it. */
export interface DialogNotice {
  /** The id `notify()` returned; the notice's group element carries it. */
  id: string;
  status: DialogNoticeStatus;
  title: string;
  description?: string;
  action?: DialogNoticeAction;
  dismissible: boolean;
}

export interface DialogNotices {
  /** The notices to render in the status area, oldest first. */
  notices: readonly DialogNotice[];
  /**
   * The text of the status area's polite live region: one line per title and
   * description, written shortly after the notices it announces appear.
   */
  announcement: readonly string[];
  /** Add a notice and return its id; an empty string while the dialog is closed. */
  notify: (options: DialogNoticeOptions) => string;
  /** Remove one notice. */
  dismissNotice: (id: string) => void;
  /** Remove every notice. */
  clearNotices: () => void;
}

const STATUSES: readonly DialogNoticeStatus[] = ["info", "success", "warning", "danger", "neutral"];
// Text written right after a live region empties is announced more reliably.
const ANNOUNCE_DELAY = 100;
const SILENT: readonly string[] = [];

const PREFIX = "dialog-notice-";
let counter = 0;

/**
 * The status area of a dialog (internal to `useDialog`): notices about the
 * dialog's own task and the announcement of each one, once, when it is added
 * (ADR 0016). The same logic as the custom elements adapter's `DialogStatus`.
 *
 * Notices belong to one opening of the dialog: `notify()` shows nothing while
 * the panel is closed, and closing it clears every notice. A notice never
 * takes focus; when one that holds focus goes away, the panel takes focus, the
 * way it does when the dialog opens.
 */
export function useDialogNotices(
  panelRef: RefObject<HTMLDialogElement | null>,
  open: boolean,
): DialogNotices {
  const [notices, setNotices] = useState<readonly DialogNotice[]>([]);
  const [announcement, setAnnouncement] = useState<readonly string[]>(SILENT);
  // Announcements wait a moment, so they batch and follow an emptied region.
  const pending = useRef<{ id: string; parts: string[] }[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Removing the element that holds focus would drop focus to the page: the
  // panel takes it first. Runs in the caller's event, before the removal.
  const keepFocus = useCallback(
    (leaving: (id: string) => boolean) => {
      const panel = panelRef.current;
      const active = panel?.ownerDocument.activeElement;
      if (!panel || !active || !panel.contains(active)) return;
      const notice = active.closest(`[id^="${PREFIX}"]`);
      if (notice && leaving(notice.id)) panel.focus();
    },
    [panelRef],
  );

  const silence = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
    pending.current = [];
    setAnnouncement(SILENT);
  }, []);

  const notify = useCallback(
    (options: DialogNoticeOptions) => {
      if (!panelRef.current?.open) return "";
      const id = `${PREFIX}${++counter}`;
      const status = STATUSES.includes(options.status as DialogNoticeStatus)
        ? (options.status as DialogNoticeStatus)
        : "info";
      const notice: DialogNotice = {
        id,
        status,
        title: options.title,
        description: options.description,
        action: options.action,
        dismissible: options.dismissible !== false,
      };
      setNotices((current) => [...current, notice]);

      pending.current.push({
        id,
        parts: [options.title, options.description ?? ""].filter(Boolean),
      });
      if (timer.current === undefined) {
        // Emptied first, so the same text twice is still a change.
        setAnnouncement(SILENT);
        timer.current = setTimeout(() => {
          timer.current = undefined;
          const lines = pending.current.flatMap(({ parts }) => parts);
          pending.current = [];
          if (lines.length) setAnnouncement(lines);
        }, ANNOUNCE_DELAY);
      }
      return id;
    },
    [panelRef],
  );

  const dismissNotice = useCallback(
    (id: string) => {
      pending.current = pending.current.filter((entry) => entry.id !== id);
      keepFocus((leaving) => leaving === id);
      setNotices((current) => current.filter((notice) => notice.id !== id));
    },
    [keepFocus],
  );

  const clearNotices = useCallback(() => {
    keepFocus(() => true);
    setNotices([]);
    silence();
  }, [keepFocus, silence]);

  // Closing ends the opening the notices belonged to.
  useEffect(() => {
    if (!open) return;
    return () => {
      setNotices([]);
      silence();
    };
  }, [open, silence]);

  return { notices, announcement, notify, dismissNotice, clearNotices };
}
