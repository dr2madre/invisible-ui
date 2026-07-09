import { writable, type Readable } from "svelte/store";
import type { ButtonVariant } from "../button/create-button";

export type NotificationStatus = "info" | "success" | "warning" | "danger" | "neutral";

/**
 * Why a notification closed:
 * - `"user"` — the close button or a swipe.
 * - `"timeout"` — the auto-dismiss countdown elapsed.
 * - `"action"` — an action button that dismisses (not `keepOpen`).
 * - `"api"` — `dismiss()`/`clear()` from code.
 * Lets the canonical "delete + Undo" flow finalize on `timeout`/`user` and
 * cancel on `action`.
 */
export type NotificationDismissReason = "user" | "timeout" | "action" | "api";

/** An action button shown inside a notification. */
export interface NotificationAction {
  label: string;
  variant?: ButtonVariant;
  /** Run when the action is clicked. */
  onClick?: () => void;
  /** Keep the notification open after the action runs. Defaults to `false` (dismiss). */
  keepOpen?: boolean;
}

/** Options accepted when showing a notification. */
export interface NotificationOptions {
  /**
   * Stable id. Pass one to `show()` to **replace** an existing notification in
   * place (e.g. "Saving…" → "Saved") instead of stacking a new one; omit it
   * and one is generated.
   */
  id?: string;
  status?: NotificationStatus;
  title?: string;
  /** Body text. */
  text?: string;
  /**
   * Auto-dismiss delay in ms. `0` (default) keeps the notification until
   * dismissed — auto-dismiss is opt-in. A snack with no close button should
   * set one so it can't become a dead end.
   */
  duration?: number;
  /** Whether to render the close button. Defaults to `true`. */
  closable?: boolean;
  /** Live-region role. `"status"` (polite) by default; `"alert"` for urgent. */
  role?: "status" | "alert";
  /** Action buttons. */
  actions?: NotificationAction[];
  /**
   * High-contrast inverse surface for maximum visibility. Recommended for
   * transient info outcomes that auto-dismiss (saved, offline, downtime…).
   */
  inverted?: boolean;
  /**
   * Snackbar layout: a single compact row — icon, title and an inline action,
   * vertically centered, in a container that wraps its content. No
   * description; the icon takes the text color with no box.
   */
  snack?: boolean;
  /** Shape of the FeedbackIcon box — `"rounded"` (default) or a full `"round"` circle. */
  iconShape?: "rounded" | "round";
  /** FeedbackIcon box override (see Alert): force `"tint"`/`"solid"` on a tinted surface. */
  iconBox?: "tint" | "transparent" | "solid";
  /**
   * Rich content: a Svelte component rendered as the body instead of `text`
   * (a file preview, an avatar row). Its props go in `componentProps`.
   */
  component?: import("svelte").ComponentType;
  /** Props for `component`. */
  componentProps?: Record<string, unknown>;
  /**
   * Called once when the notification closes, with the reason. Fires for every
   * path (close button, swipe, timeout, action, or `dismiss()`/`clear()`), not
   * when a `show()` with the same id merely replaces it.
   */
  onDismiss?: (reason: NotificationDismissReason) => void;
}

/** A queued notice, with its generated id. */
export interface NotificationItem extends NotificationOptions {
  id: string;
}

/** Messages for {@link Notifier.promise}; success/error may derive from the result. */
export interface NotificationPromiseMessages<T> {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((error: unknown) => string);
  /** Auto-dismiss delay for the resolved success/error notification. Defaults to `0` (persistent). */
  duration?: number;
}

/** Convenience options for the status helpers — status is set by the method. */
export type StatusOptions = Omit<NotificationOptions, "status" | "title">;

export interface Notifier {
  /** The reactive list of active notifications (oldest first). */
  subscribe: Readable<NotificationItem[]>["subscribe"];
  /**
   * Queue a notification; returns its id. If `options.id` matches a live
   * notification, that one is replaced in place (no new entry, no `onDismiss`).
   */
  show: (options?: NotificationOptions) => string;
  /** Shorthand for `show({ status: "info", title, ...options })`. */
  info: (title: string, options?: StatusOptions) => string;
  /** Shorthand for `show({ status: "success", title, ...options })`. */
  success: (title: string, options?: StatusOptions) => string;
  /** Shorthand for `show({ status: "warning", title, ...options })`. */
  warning: (title: string, options?: StatusOptions) => string;
  /** Shorthand for `show({ status: "danger", title, ...options })`. */
  danger: (title: string, options?: StatusOptions) => string;
  /** Shorthand for `show({ status: "neutral", title, ...options })`. */
  neutral: (title: string, options?: StatusOptions) => string;
  /** Update an existing notice in place. */
  update: (id: string, patch: NotificationOptions) => void;
  /** Remove a notification by id, firing its `onDismiss` with the reason (default `"api"`). */
  dismiss: (id: string, reason?: NotificationDismissReason) => void;
  /** Remove all notifications, firing each `onDismiss("api")`. */
  clear: () => void;
  /**
   * Show a loading notice tied to a promise, then swap it to success or
   * error when the promise settles. Returns the original promise.
   */
  promise: <T>(promise: Promise<T>, messages: NotificationPromiseMessages<T>) => Promise<T>;
}

let counter = 0;
const nextId = () => `notice-${++counter}`;

const resolveMessage = <A>(message: string | ((arg: A) => string), arg: A): string =>
  typeof message === "function" ? message(arg) : message;

/**
 * Create a notifier: a small store that manages a list of notifications,
 * decoupled from rendering. Pair it with `NotificationRegion` to display the
 * queue. Timing lives in the `Notice` component, so the store stays
 * simple and side-effect free.
 */
export function createNotifier(): Notifier {
  const { subscribe, update: updateStore } = writable<NotificationItem[]>([]);
  // onDismiss callbacks live outside the reactive list so the store stays
  // plain-data; keyed by id, cleared when the notification leaves.
  const onDismissById = new Map<string, (reason: NotificationDismissReason) => void>();

  const update = (id: string, patch: NotificationOptions) => {
    if (patch.onDismiss) onDismissById.set(id, patch.onDismiss);
    updateStore((items) => items.map((n) => (n.id === id ? { ...n, ...patch, id } : n)));
  };

  const dismiss = (id: string, reason: NotificationDismissReason = "api") => {
    let existed = false;
    updateStore((items) => {
      existed = items.some((n) => n.id === id);
      return items.filter((n) => n.id !== id);
    });
    if (existed) onDismissById.get(id)?.(reason);
    onDismissById.delete(id);
  };

  const show = (options: NotificationOptions = {}): string => {
    // A live id replaces in place (dedup); otherwise append.
    if (options.id) {
      let exists = false;
      updateStore((items) => {
        exists = items.some((n) => n.id === options.id);
        return items;
      });
      if (exists) {
        update(options.id, options);
        return options.id;
      }
    }
    const id = options.id ?? nextId();
    if (options.onDismiss) onDismissById.set(id, options.onDismiss);
    updateStore((items) => [...items, { ...options, id }]);
    return id;
  };

  const withStatus =
    (status: NotificationStatus) =>
    (title: string, options: StatusOptions = {}): string =>
      show({ ...options, status, title });

  const clear = () =>
    updateStore((items) => {
      for (const n of items) {
        onDismissById.get(n.id)?.("api");
        onDismissById.delete(n.id);
      }
      return [];
    });

  const promise = async <T>(
    p: Promise<T>,
    messages: NotificationPromiseMessages<T>,
  ): Promise<T> => {
    const duration = messages.duration ?? 0;
    const id = show({
      status: "info",
      title: messages.loading,
      duration: 0,
      closable: false,
    });
    try {
      const data = await p;
      update(id, {
        status: "success",
        title: resolveMessage(messages.success, data),
        duration,
        closable: true,
      });
      return data;
    } catch (error) {
      update(id, {
        status: "danger",
        title: resolveMessage(messages.error, error),
        duration,
        closable: true,
        role: "alert",
      });
      throw error;
    }
  };

  return {
    subscribe,
    show,
    info: withStatus("info"),
    success: withStatus("success"),
    warning: withStatus("warning"),
    danger: withStatus("danger"),
    neutral: withStatus("neutral"),
    update,
    dismiss,
    clear,
    promise,
  };
}
