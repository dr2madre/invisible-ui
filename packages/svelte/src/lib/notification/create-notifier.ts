import { writable, type Readable } from "svelte/store";
import type { ButtonVariant } from "../button/create-button";

export type NotificationStatus = "info" | "success" | "warning" | "danger" | "neutral";

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
  status?: NotificationStatus;
  title?: string;
  /** Body text. */
  text?: string;
  /**
   * Auto-dismiss delay in ms. `0` keeps the notification until dismissed.
   * Defaults to `5000`.
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

export interface Notifier {
  /** The reactive list of active notifications (oldest first). */
  subscribe: Readable<NotificationItem[]>["subscribe"];
  /** Queue a notification; returns its id. */
  show: (options?: NotificationOptions) => string;
  /** Update an existing notice in place. */
  update: (id: string, patch: NotificationOptions) => void;
  /** Remove a notification by id. */
  dismiss: (id: string) => void;
  /** Remove all notifications. */
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

  const dismiss = (id: string) => updateStore((items) => items.filter((n) => n.id !== id));

  const show = (options: NotificationOptions = {}): string => {
    const id = nextId();
    updateStore((items) => [...items, { ...options, id }]);
    return id;
  };

  const update = (id: string, patch: NotificationOptions) =>
    updateStore((items) => items.map((n) => (n.id === id ? { ...n, ...patch, id } : n)));

  const clear = () => updateStore(() => []);

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

  return { subscribe, show, update, dismiss, clear, promise };
}
