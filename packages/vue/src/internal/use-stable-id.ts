import { getCurrentInstance } from "vue";

const counters = new WeakMap<object, Map<string, number>>();

/**
 * Returns an id that is deterministic within one Vue application. Each SSR
 * request has its own app context, so a long-lived server cannot advance the
 * ids later emitted by the browser bundle during hydration.
 */
export function useStableId(prefix: string): string {
  const instance = getCurrentInstance();
  if (!instance) throw new Error("useStableId must be called during component setup");

  let appCounters = counters.get(instance.appContext);
  if (!appCounters) {
    appCounters = new Map();
    counters.set(instance.appContext, appCounters);
  }

  const next = (appCounters.get(prefix) ?? 0) + 1;
  appCounters.set(prefix, next);
  return `${prefix}-${next}`;
}
