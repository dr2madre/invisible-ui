import type { ComponentType } from "react";
import type { ButtonVariant } from "../button/use-button";

export type NotificationStatus = "info" | "success" | "warning" | "danger" | "neutral";

/**
 * Why a notification closed:
 * - `"user"`: the close button or a swipe.
 * - `"timeout"`: the auto-dismiss countdown ran out.
 * - `"action"`: an action button that dismisses (not `keepOpen`).
 * - `"api"`: `dismiss()` or `clear()` from code.
 * A "delete, then Undo" flow finalizes on `timeout` or `user` and cancels on
 * `action`.
 */
export type NotificationDismissReason = "user" | "timeout" | "action" | "api";

/** An action button shown inside a notification. */
export interface NotificationAction {
  label: string;
  variant?: ButtonVariant;
  /** Run when the action is pressed. */
  onClick?: () => void;
  /** Keep the notification open after the action runs. Defaults to `false` (dismiss). */
  keepOpen?: boolean;
}

/** Options accepted when showing a notification. */
export interface NotificationOptions {
  /**
   * Stable id. Pass one to `show()` to replace a live notification in place
   * ("Saving…", then "Saved") instead of stacking a new one; omit it and one
   * is generated.
   */
  id?: string;
  status?: NotificationStatus;
  title?: string;
  /** Body text. */
  text?: string;
  /**
   * Auto-dismiss delay in ms. `0` (default) keeps the notification until it
   * is dismissed. A snack with no close button sets one, so it always leaves.
   */
  duration?: number;
  /** Whether to render the close button. Defaults to `true`. */
  closable?: boolean;
  /** Live-region role: `"status"` (polite, default) or `"alert"` (urgent). */
  role?: "status" | "alert";
  /** Action buttons. */
  actions?: NotificationAction[];
  /** A high-contrast surface, for short outcomes that auto-dismiss. */
  inverted?: boolean;
  /** Snackbar layout: one compact row with the icon, the title and an inline action. */
  snack?: boolean;
  /** Shape of the icon box: `"rounded"` (default) or a full `"round"` circle. */
  iconShape?: "rounded" | "round";
  /** Icon box override (see `InlineNotification`). */
  iconBox?: "tint" | "transparent" | "solid";
  /** Rich content: a component rendered as the body in place of `text`. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the props are the component's own
  component?: ComponentType<any>;
  /** Props for `component`. */
  componentProps?: Record<string, unknown>;
  /**
   * Called once when the notification closes, with the reason: the close
   * button, a swipe, the timeout, an action, `dismiss()` or `clear()`. A
   * `show()` that replaces it under the same id does not call it.
   */
  onDismiss?: (reason: NotificationDismissReason) => void;
}

/** A queued notification, with its id. */
export interface NotificationItem extends NotificationOptions {
  id: string;
}

/** Messages for `promise()`; success and error may derive from the result. */
export interface NotificationPromiseMessages<T> {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((error: unknown) => string);
  /** Auto-dismiss delay for the settled notification. Defaults to `0` (persistent). */
  duration?: number;
}

/** Options for the status shorthands: the method sets the status and the title. */
export type StatusOptions = Omit<NotificationOptions, "status" | "title">;

export interface Notifier {
  /**
   * Listen for changes to the list; returns the unsubscribe. With
   * `getSnapshot`, the shape `useSyncExternalStore` takes.
   */
  subscribe: (listener: () => void) => () => void;
  /**
   * The active notifications, oldest first, including the ones a region holds
   * back while a modal dialog is open. A new array after every change.
   */
  getSnapshot: () => readonly NotificationItem[];
  /**
   * Queue a notification; returns its id. When `options.id` matches a live
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
  /** Update a notification in place. */
  update: (id: string, patch: NotificationOptions) => void;
  /** Remove a notification by id, calling its `onDismiss` with the reason (default `"api"`). */
  dismiss: (id: string, reason?: NotificationDismissReason) => void;
  /** Remove every notification, calling each `onDismiss("api")`. */
  clear: () => void;
  /**
   * Show a loading notification tied to a promise, then turn it into success
   * or error when the promise settles. Returns the original promise.
   */
  promise: <T>(promise: Promise<T>, messages: NotificationPromiseMessages<T>) => Promise<T>;
}

const resolveMessage = <A>(message: string | ((arg: A) => string), arg: A): string =>
  typeof message === "function" ? message(arg) : message;

/**
 * Create a notifier: a small store that holds a list of notifications, apart
 * from any rendering, the counterpart of the Svelte and Vue adapters'
 * `createNotifier`. Pass it to `NotificationRegion` to show the queue. Timing
 * lives in the `Notification` component, so the store has no side effects.
 *
 * Create it once, outside the component tree or in a ref, and keep it for
 * the life of the page: the region and the code that shows notifications
 * share it. The list is replaced on every change, so `getSnapshot` is safe
 * for `useSyncExternalStore`.
 */
export function createNotifier(): Notifier {
  // Ids count per notifier, so two notifiers (one per server request, say)
  // never share a sequence.
  let counter = 0;
  const nextId = () => `notice-${++counter}`;
  let items: readonly NotificationItem[] = [];
  const listeners = new Set<() => void>();
  const write = (next: readonly NotificationItem[]) => {
    items = next;
    for (const listener of [...listeners]) listener();
  };
  // onDismiss callbacks live outside the list so the list stays plain data;
  // keyed by id, forgotten when the notification leaves.
  const onDismissById = new Map<string, (reason: NotificationDismissReason) => void>();

  const update = (id: string, patch: NotificationOptions) => {
    if (patch.onDismiss) onDismissById.set(id, patch.onDismiss);
    write(items.map((n) => (n.id === id ? { ...n, ...patch, id } : n)));
  };

  const dismiss = (id: string, reason: NotificationDismissReason = "api") => {
    if (!items.some((n) => n.id === id)) return;
    // The list changes first, then the notification is told (ADR 0011).
    write(items.filter((n) => n.id !== id));
    const handler = onDismissById.get(id);
    onDismissById.delete(id);
    handler?.(reason);
  };

  const show = (options: NotificationOptions = {}): string => {
    // A live id replaces in place; otherwise the notification is appended.
    if (options.id && items.some((n) => n.id === options.id)) {
      update(options.id, options);
      return options.id;
    }
    const id = options.id ?? nextId();
    if (options.onDismiss) onDismissById.set(id, options.onDismiss);
    write([...items, { ...options, id }]);
    return id;
  };

  const withStatus =
    (status: NotificationStatus) =>
    (title: string, options: StatusOptions = {}): string =>
      show({ ...options, status, title });

  const clear = () => {
    // The list empties first, then every notification is told (ADR 0011): a
    // handler reading the list sees it empty, and one that shows a new
    // notification keeps it.
    const cleared = items;
    write([]);
    for (const n of cleared) {
      const handler = onDismissById.get(n.id);
      // Forgotten before the call: a handler that shows a replacement under
      // the same id registers a new one, which must survive.
      onDismissById.delete(n.id);
      handler?.("api");
    }
  };

  const promise = async <T>(
    p: Promise<T>,
    messages: NotificationPromiseMessages<T>,
  ): Promise<T> => {
    const duration = messages.duration ?? 0;
    const id = show({ status: "info", title: messages.loading, duration: 0, closable: false });
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
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => items,
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
