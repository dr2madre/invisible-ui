import type { AsyncContentContext, AsyncView } from "./types";

/**
 * Derive the one view to present. Pure: no data inspection, no timers, no
 * side effects. Contradictions are normalized, never guessed from data:
 * `isEmpty` counts only after success with no content, existing content
 * always survives loading and errors, and an unknown status (plain
 * JavaScript callers) falls back to the inert idle view.
 */
export function deriveAsyncView(context: AsyncContentContext): AsyncView {
  const { status, hasContent } = context;
  switch (status) {
    case "loading":
      return hasContent ? "refreshing" : "initial-loading";
    case "success":
      return !hasContent && context.isEmpty === true ? "empty" : "content";
    case "error":
      return hasContent ? "stale-error" : "initial-error";
    case "idle":
    default:
      return "idle";
  }
}
