import type { Action } from "svelte/action";
import { writable, type Readable } from "svelte/store";
import { createDialog, type CreateDialog, type DialogContext } from "../dialog/create-dialog";

/** Drawer context — a Dialog context without `role` (a drawer is always a dialog). */
export type DrawerContext = Omit<DialogContext, "role">;

export interface CreateDrawer extends CreateDialog {
  /** Current downward drag offset of the panel, in px (0 at rest). */
  dragOffset: Readable<number>;
  /** Whether a drag is in progress (disable the snap transition while true). */
  dragging: Readable<boolean>;
  /** Svelte action for the grab handle that drives the drag-to-dismiss gesture. */
  handleAction: Action<HTMLElement>;
}

/** Fraction of the panel height past which releasing dismisses the drawer. */
const DISMISS_DISTANCE_RATIO = 0.25;
/** Downward velocity (px/ms) past which releasing dismisses regardless of distance. */
const DISMISS_VELOCITY = 0.5;

/**
 * Create a bottom drawer: a modal dialog with a drag-to-dismiss gesture. Open
 * state, focus trap, scroll lock, Escape / outside-press dismissal, focus
 * restore and ARIA all come from `createDialog` (the shared modal adapter); this
 * wrapper only adds the drag. Attach `handleAction` to the grab handle, bind the
 * panel's `transform` to `dragOffset` and toggle a "dragging" class with
 * `dragging`. A release past a distance or velocity threshold closes the drawer;
 * anything less snaps it home (via a CSS transition you define on the panel).
 */
export function createDrawer(context: DrawerContext = {}): CreateDrawer {
  const dialog = createDialog(context);
  const { setOpen } = dialog;

  const dragOffset = writable(0);
  const dragging = writable(false);

  const handleAction: Action<HTMLElement> = (node) => {
    let startY = 0;
    let panelHeight = 0;
    let lastY = 0;
    let lastTime = 0;
    let velocity = 0;
    let pointerId: number | null = null;

    const onMove = (event: PointerEvent) => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      const dt = event.timeStamp - lastTime;
      if (dt > 0) velocity = (event.clientY - lastY) / dt;
      lastY = event.clientY;
      lastTime = event.timeStamp;
      dragOffset.set(Math.max(0, event.clientY - startY));
    };

    const end = (event: PointerEvent) => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      node.releasePointerCapture?.(pointerId);
      pointerId = null;
      dragging.set(false);

      const dy = Math.max(0, event.clientY - startY);
      const dismiss =
        (panelHeight > 0 && dy > panelHeight * DISMISS_DISTANCE_RATIO) ||
        velocity > DISMISS_VELOCITY;
      if (dismiss) setOpen(false);
      dragOffset.set(0); // snap home (open) or reset for next time (closed)
    };

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const panel = node.closest<HTMLElement>(".drawer__panel");
      panelHeight = panel?.offsetHeight ?? 0;
      startY = lastY = event.clientY;
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
