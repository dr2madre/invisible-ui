/**
 * Ids that are deterministic across SSR and hydration: one counter per prefix.
 *
 * In the browser the counters run for the life of the page. The hydration pass
 * allocates ids in the same order as the server render that produced the page,
 * and later mounts keep drawing fresh ids, so ids stay unique.
 *
 * On the server the counters reset after each render (Svelte renders
 * synchronously, so a queued microtask runs right after the render that first
 * drew an id). A long-lived server process therefore serves every request from
 * the same fresh scope: the scope a new browser runtime starts from.
 */
const counters = new Map<string, number>();
let resetQueued = false;

/** Next id for `prefix`. An explicit consumer id always wins over calling this. */
export function stableId(prefix: string): string {
  if (typeof document === "undefined" && !resetQueued) {
    resetQueued = true;
    queueMicrotask(() => {
      counters.clear();
      resetQueued = false;
    });
  }
  const next = (counters.get(prefix) ?? 0) + 1;
  counters.set(prefix, next);
  return `${prefix}-${next}`;
}
