import type { Action } from "svelte/action";
import { writable, type Readable } from "svelte/store";
import { createDialog, type CreateDialog, type DialogContext } from "../dialog/create-dialog";

export type SheetDialogSide = "top" | "right" | "bottom" | "left";

/** SheetDialog context — a Dialog context without `role` (an edge panel is always a dialog), plus the anchored edge. */
export interface SheetDialogContext extends Omit<DialogContext, "role"> {
  /** Which edge the panel is anchored to. Default `"right"`. */
  side?: SheetDialogSide;
}

export interface CreateSheetDialog extends CreateDialog {
  /** Current outward drag offset of the panel, in px (0 at rest). */
  dragOffset: Readable<number>;
  /** Whether a drag is in progress (disable the snap transition while true). */
  dragging: Readable<boolean>;
  /** Svelte action for the grab handle that drives the drag-to-dismiss gesture. */
  handleAction: Action<HTMLElement>;
}

/** Fraction of the panel extent past which releasing dismisses the panel. */
const DISMISS_DISTANCE_RATIO = 0.25;
/** Outward velocity (px/ms) past which releasing dismisses regardless of distance. */
const DISMISS_VELOCITY = 0.5;

/**
 * Create an edge-anchored modal dialog with an optional drag-to-dismiss
 * gesture. Open state, focus trap, scroll lock, Escape / outside-press
 * dismissal, focus restore and ARIA all come from `createDialog` (the shared
 * modal adapter); this wrapper only adds the drag, along the axis of the
 * anchored edge ("outward" = toward that edge). Attach `handleAction` to the
 * grab handle, bind the panel's `transform` to `dragOffset` and toggle a
 * "dragging" class with `dragging`. A release past a distance or velocity
 * threshold closes the panel; anything less snaps it home (via a CSS
 * transition you define on the panel).
 */
export function createSheetDialog(context: SheetDialogContext = {}): CreateSheetDialog {
  const { side = "right", ...dialogContext } = context;
  const dialog = createDialog(dialogContext);
  const { setOpen } = dialog;

  const dragOffset = writable(0);
  const dragging = writable(false);

  // Outward = toward the anchored edge, always positive when dismissing.
  const outward = (x: number, y: number, startX: number, startY: number) => {
    switch (side) {
      case "bottom":
        return y - startY;
      case "top":
        return startY - y;
      case "right":
        return x - startX;
      case "left":
        return startX - x;
    }
  };

  const handleAction: Action<HTMLElement> = (node) => {
    let startX = 0;
    let startY = 0;
    let panelExtent = 0;
    let lastOffset = 0;
    let lastTime = 0;
    let velocity = 0;
    let pointerId: number | null = null;

    const onMove = (event: PointerEvent) => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      const offset = outward(event.clientX, event.clientY, startX, startY);
      const dt = event.timeStamp - lastTime;
      if (dt > 0) velocity = (offset - lastOffset) / dt;
      lastOffset = offset;
      lastTime = event.timeStamp;
      dragOffset.set(Math.max(0, offset));
    };

    const end = (event: PointerEvent) => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      node.releasePointerCapture?.(pointerId);
      pointerId = null;
      dragging.set(false);

      const offset = Math.max(0, outward(event.clientX, event.clientY, startX, startY));
      const dismiss =
        (panelExtent > 0 && offset > panelExtent * DISMISS_DISTANCE_RATIO) ||
        velocity > DISMISS_VELOCITY;
      if (dismiss) setOpen(false);
      dragOffset.set(0); // snap home (open) or reset for next time (closed)
    };

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const panel = node.closest<HTMLElement>(".sheet-dialog__panel");
      panelExtent =
        side === "top" || side === "bottom"
          ? (panel?.offsetHeight ?? 0)
          : (panel?.offsetWidth ?? 0);
      startX = event.clientX;
      startY = event.clientY;
      lastOffset = 0;
      lastTime = event.timeStamp;
      velocity = 0;
      pointerId = event.pointerId;
      node.setPointerCapture?.(event.pointerId);
      dragging.set(true);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", end);
      window.addEventListener("pointercancel", end);
    };

    node.addEventListener("pointerdown", onDown);
    return {
      destroy() {
        node.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", end);
        window.removeEventListener("pointercancel", end);
      },
    };
  };

  return { ...dialog, dragOffset, dragging, handleAction };
}
