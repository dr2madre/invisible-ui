import { useState } from "react";

/**
 * Whether this render is the one in which `open` turned on (internal). A
 * dialog that starts each opening from a clean state resets it on this render,
 * while rendering: no effect, and no paint of the stale state first. React
 * reruns the component at once for the state written here, and the rerun
 * returns `false`.
 */
export function useOpening(open: boolean): boolean {
  const [wasOpen, setWasOpen] = useState(open);
  if (open === wasOpen) return false;
  setWasOpen(open);
  return open;
}
