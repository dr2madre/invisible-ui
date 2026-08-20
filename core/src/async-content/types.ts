/** The application's request phase. The core never runs the request itself. */
export type AsyncStatus = "idle" | "loading" | "success" | "error";

/**
 * Data-free input for the view derivation. `hasContent` says whether the
 * application already holds something to show; `isEmpty` is the consumer's
 * explicit statement that a successful result held nothing. The core never
 * inspects data to decide either.
 */
export interface AsyncContentContext {
  status: AsyncStatus;
  hasContent: boolean;
  isEmpty?: boolean;
}

/** The single view the application should present for a context. */
export type AsyncView =
  "idle" | "initial-loading" | "content" | "refreshing" | "empty" | "initial-error" | "stale-error";
