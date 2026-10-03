import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { useDialog, type UseDialog, type UseDialogOptions } from "../dialog/use-dialog";
import { useIsomorphicLayoutEffect } from "../internal/layout-effect";

export type SheetDialogSide = "top" | "right" | "bottom" | "left";

/**
 * SheetDialog options: the Dialog options without `role` (an edge panel is
 * always a dialog), plus the anchored edge.
 */
export interface UseSheetDialogOptions extends Omit<UseDialogOptions, "role"> {
  /** Which edge the panel is anchored to. Default `"right"`. */
  side?: SheetDialogSide;
}

export interface UseSheetDialog extends UseDialog {
  /** Whether a drag is in progress (turn the snap transition off while true). */
  dragging: boolean;
  /** Start the drag-to-dismiss gesture; attach to the grab handle's `onPointerDown`. */
  onHandlePointerDown: (event: PointerEvent<HTMLElement>) => void;
}

/** Fraction of the panel extent past which releasing dismisses the panel. */
const DISMISS_DISTANCE_RATIO = 0.25;
/** Outward velocity (px/ms) past which releasing dismisses regardless of distance. */
const DISMISS_VELOCITY = 0.5;

/** The panel's transform for an outward drag offset; none at rest or on top. */
function dragTransform(side: SheetDialogSide, offset: number): string {
  if (offset === 0) return "";
  if (side === "bottom") return `translateY(${offset}px)`;
  if (side === "right") return `translateX(${offset}px)`;
  if (side === "left") return `translateX(${-offset}px)`;
  return "";
}

/**
 * Connect an edge-anchored modal dialog with an optional drag-to-dismiss
 * gesture. Open state, modality, scroll lock, Escape and outside-press
 * dismissal, focus restore, the status area and ARIA all come from
 * `useDialog`; this hook adds only the drag, along the axis of the anchored
 * edge ("outward" means toward that edge). Attach `onHandlePointerDown` to the
 * grab handle and a "dragging" class to `dragging`. A release past a distance
 * or velocity threshold closes the panel; anything less snaps it home through
 * the CSS transition on the panel.
 *
 * The drag offset changes on every pointer move, so the hook writes it to the
 * panel's `transform` directly instead of rendering it: a drag re-renders the
 * component twice, when it starts and when it ends.
 */
export function useSheetDialog({
  side = "right",
  ...options
}: UseSheetDialogOptions = {}): UseSheetDialog {
  const dialog = useDialog(options);
  const { panelRef, setOpen } = dialog;
  const [dragging, setDragging] = useState(false);

  // The gesture in flight; read by the window listeners, never rendered.
  const drag = useRef<(() => void) | null>(null);
  const latest = useRef({ side, setOpen });
  useIsomorphicLayoutEffect(() => {
    latest.current = { side, setOpen };
  });
  // A drag still in flight when the component goes away leaves no listener.
  useEffect(() => () => drag.current?.(), []);

  const onHandlePointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const handle = event.currentTarget;
      const panel = panelRef.current;
      const edge = latest.current.side;
      const extent =
        edge === "top" || edge === "bottom"
          ? (panel?.offsetHeight ?? 0)
          : (panel?.offsetWidth ?? 0);
      const { clientX: startX, clientY: startY, pointerId } = event;
      let lastOffset = 0;
      // The native stamp: the synthetic one stands in Date.now() for a zero.
      let lastTime = event.nativeEvent.timeStamp;
      let velocity = 0;

      // Outward means toward the anchored edge, so it stays positive while dismissing.
      const outward = (x: number, y: number) =>
        edge === "bottom"
          ? y - startY
          : edge === "top"
            ? startY - y
            : edge === "left"
              ? startX - x
              : x - startX;

      const onMove = (move: globalThis.PointerEvent) => {
        if (move.pointerId !== pointerId) return;
        const offset = outward(move.clientX, move.clientY);
        const dt = move.timeStamp - lastTime;
        if (dt > 0) velocity = (offset - lastOffset) / dt;
        lastOffset = offset;
        lastTime = move.timeStamp;
        if (panel) panel.style.transform = dragTransform(edge, Math.max(0, offset));
      };

      const detach = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", end);
        window.removeEventListener("pointercancel", end);
        drag.current = null;
      };

      function end(up: globalThis.PointerEvent) {
        if (up.pointerId !== pointerId) return;
        detach();
        handle.releasePointerCapture?.(pointerId);
        setDragging(false);
        const offset = Math.max(0, outward(up.clientX, up.clientY));
        // Snap home (still open) or reset for the next opening (closed).
        if (panel) panel.style.transform = "";
        if (
          (extent > 0 && offset > extent * DISMISS_DISTANCE_RATIO) ||
          velocity > DISMISS_VELOCITY
        ) {
          latest.current.setOpen(false);
        }
      }

      drag.current?.();
      drag.current = detach;
      handle.setPointerCapture?.(pointerId);
      setDragging(true);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", end);
      window.addEventListener("pointercancel", end);
    },
    [panelRef],
  );

  return { ...dialog, dragging, onHandlePointerDown };
}
