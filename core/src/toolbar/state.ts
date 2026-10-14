import type { ToolbarControlKind, ToolbarControlLike, ToolbarMoveOptions } from "./types";

/**
 * The index focus moves to, or `null` when the key is not one the toolbar
 * handles (so the adapter leaves the event alone). Movement wraps around, and
 * Home and End jump to the ends.
 */
export function nextIndex({
  key,
  index,
  count,
  orientation = "horizontal",
  direction = "ltr",
  control = "other",
}: ToolbarMoveOptions): number | null {
  if (count <= 0 || index < 0 || index >= count) return null;
  if (keepsKey(control, key, orientation)) return null;

  const wrap = (next: number) => ((next % count) + count) % count;

  if (key === "Home") return 0;
  if (key === "End") return count - 1;

  const horizontal = orientation === "horizontal";
  // In right-to-left text the visual start is on the right, so ArrowRight
  // walks back through the controls and ArrowLeft walks forward.
  const forwardKey = horizontal ? (direction === "rtl" ? "ArrowLeft" : "ArrowRight") : "ArrowDown";
  const backwardKey = horizontal ? (direction === "rtl" ? "ArrowRight" : "ArrowLeft") : "ArrowUp";

  if (key === forwardKey) return wrap(index + 1);
  if (key === backwardKey) return wrap(index - 1);
  return null;
}

/** Input types whose value is text or segments the arrows move through. */
const TEXT_TYPES = new Set([
  "text",
  "search",
  "email",
  "url",
  "tel",
  "password",
  "number",
  "date",
  "time",
  "datetime-local",
  "month",
  "week",
]);

/**
 * What an element does with the keys, so a toolbar does not take the ones it
 * needs. A read-only input has no caret to move, so it counts as any other
 * control.
 */
export function controlKind(element: ToolbarControlLike | null | undefined): ToolbarControlKind {
  if (!element) return "other";
  const tag = element.tagName.toLowerCase();
  if (element.isContentEditable || tag === "textarea") return "multiline";
  const editable = tag === "input" && !element.readOnly;
  return editable && TEXT_TYPES.has((element.type ?? "text").toLowerCase()) ? "text" : "other";
}

// A text field keeps the arrows along the toolbar's axis for its caret (the
// other axis moves no caret in one line) and Home and End for its ends.
function keepsKey(
  control: ToolbarControlKind,
  key: string,
  orientation: "horizontal" | "vertical",
): boolean {
  if (control === "other") return false;
  if (key === "Home" || key === "End") return true;
  if (control === "multiline") return key.startsWith("Arrow");
  return orientation === "horizontal"
    ? key === "ArrowLeft" || key === "ArrowRight"
    : key === "ArrowUp" || key === "ArrowDown";
}
