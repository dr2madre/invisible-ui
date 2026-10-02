import { useEffect, useLayoutEffect } from "react";

/**
 * `useLayoutEffect` in the browser and `useEffect` on the server, where a
 * layout effect never runs and only warns.
 *
 * The hooks here use it to keep a "latest" ref: a ref that holds the props of
 * the last committed render, for callbacks and effects that must read them
 * without listing them as dependencies. Writing it in a layout effect rather
 * than during render keeps a render React throws away out of it, and it is
 * already up to date when passive effects and event handlers run.
 */
export const useIsomorphicLayoutEffect: typeof useLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
