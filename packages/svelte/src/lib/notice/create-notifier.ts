import { writable, type Readable } from "svelte/store";
import type { ButtonVariant } from "../button/create-button";

export type NoticeStatus = "info" | "success" | "warning" | "danger" | "neutral";

/** An action button shown inside a notice. */
export interface NoticeAction {
  label: string;
  variant?: ButtonVariant;
  /** Run when the action is clicked. */
  onClick?: () => void;
  /** Keep the notice open after the action runs. Defaults to `false` (dismiss). */
  keepOpen?: boolean;
}

/** Options accepted when showing a notice. */
export interface NoticeOptions {
  status?: NoticeStatus;
  title?: string;
  /** Body text. */
  text?: string;
  /**
   * Auto-dismiss delay in ms. `0` keeps the notice until dismissed.
   * Defaults to `5000`.
   */
  duration?: number;
  /** Whether to render the close button. Defaults to `true`. */
  closable?: boolean;
  /** Live-region role. `"status"` (polite) by default; `"alert"` for urgent. */
  role?: "status" | "alert";
  /** Action buttons. */
  actions?: NoticeAction[];
  /**
   * High-contrast inverse surface for maximum visibility. Recommended for
   * transient info outcomes that auto-dismiss (saved, offline, downtime…).
   */
  inverted?: boolean;
}

/** A queued notice, with its generated id. */
export interface NoticeItem extends NoticeOptions {
  id: string;
}

/** Messages for {@link Notifier.promise}; success/error may derive from the result. */
export interface NoticePromiseMessages<T> {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((error: unknown) => string);
  /** Auto-dismiss delay for the resolved success/error notice. Defaults to 5000. */
  duration?: number;
}

export interface Notifier {
  /** The reactive list of active notices (oldest first). */
  subscribe: Readable<NoticeItem[]>["subscribe"];
  /** Queue a notice; returns its id. */
  show: (options?: NoticeOptions) => string;
  /** Update an existing notice in place. */
  update: (id: string, patch: NoticeOptions) => void;
  /** Remove a notice by id. */
  dismiss: (id: string) => void;
  /** Remove all notices. */
  clear: () => void;
  /**
   * Show a loading notice tied to a promise, then swap it to success or
   * error when the promise settles. Returns the original promise.
   */
  promise: <T>(promise: Promise<T>, messages: NoticePromiseMessages<T>) => Promise<T>;
}

let counter = 0;
const nextId = () => `notice-${++counter}`;

const resolveMessage = <A>(message: string | ((arg: A) => string), arg: A): string =>
  typeof message === "function" ? message(arg) : message;

/**
 * Create a notifier: a small store that manages a list of notices,
 * decoupled from rendering. Pair it with `NoticeRegion` to display the
 * queue. Timing lives in the `Notice` component, so the store stays
 * simple and side-effect free.
 */
export function createNotifier(): Notifier {
  const { subscribe, update: updateStore } = writable<NoticeItem[]>([]);

  const dismiss = (id: string) => updateStore((items) => items.filter((n) => n.id !== id));

  const show = (options: NoticeOptions = {}): string => {
    const id = nextId();
    updateStore((items) => [...items, { ...options, id }]);
    return id;
  };

  const update = (id: string, patch: NoticeOptions) =>
    updateStore((items) => items.map((n) => (n.id === id ? { ...n, ...patch, id } : n)));

  const clear = () => updateStore(() => []);

  const promise = async <T>(p: Promise<T>, messages: NoticePromiseMessages<T>): Promise<T> => {
    const duration = messages.duration ?? 5000;
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
