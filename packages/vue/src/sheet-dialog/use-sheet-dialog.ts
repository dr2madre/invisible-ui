import { sheetDialog as sheet } from "@invisible-ui/core";
import { computed, onScopeDispose, ref, toValue, type MaybeRefOrGetter, type Ref } from "vue";
import { useDialog, type UseDialog, type UseDialogOptions } from "../dialog/use-dialog";

/**
 * The edge the panel is anchored to. `start` and `end` follow the reading
 * direction; `top` and `bottom` never move.
 */
export type SheetDialogSide = sheet.SheetSide;

/**
 * SheetDialog options: the Dialog options without `role` (an edge panel is
 * always a dialog), plus the anchored edge.
 */
export interface UseSheetDialogOptions extends Omit<UseDialogOptions, "role"> {
  /** Which edge the panel is anchored to. Default `"end"`. */
  side?: SheetDialogSide;
}

export interface UseSheetDialog extends UseDialog {
  /** Current outward drag offset of the panel, in px (0 at rest). */
  dragOffset: Ref<number>;
  /** Whether a drag is in progress (disable the snap transition while true). */
  dragging: Ref<boolean>;
  /** Start the drag-to-dismiss gesture; bind to the grab handle's `pointerdown`. */
  onHandlePointerDown: (event: PointerEvent) => void;
}

/**
 * Create an edge-anchored modal dialog with an optional drag-to-dismiss
 * gesture. Open state, focus trap, scroll lock, Escape and outside-press
 * dismissal, focus restore and ARIA all come from `useDialog` (the shared modal
 * composable); this wrapper adds only the drag, along the axis of the anchored
 * edge ("outward" means toward that edge, along the reading direction for the
 * inline edges). Bind `onHandlePointerDown` to the grab handle, the panel's
 * `--_sheet-drag` custom property to `dragOffset`, and a "dragging" class to
 * `dragging`. A release past a distance or velocity threshold closes the
 * panel; anything less snaps it home (via a CSS transition on the panel).
 */
export function useSheetDialog(
  options: MaybeRefOrGetter<UseSheetDialogOptions> = {},
): UseSheetDialog {
  const resolved = computed(() => toValue(options));
  const dialog = useDialog(() => {
    const { side: _side, ...dialogOptions } = resolved.value;
    return dialogOptions;
  });

  const dragOffset = ref(0);
  const dragging = ref(false);

  const edge = () => sheet.edge(resolved.value.side);
  // Outward means toward the anchored edge, so it stays positive while dismissing.
  const outward = (x: number, y: number, startX: number, startY: number) =>
    sheet.outward(edge(), direction, x - startX, y - startY);

  let startX = 0;
  let startY = 0;
  let panelExtent = 0;
  let direction: "ltr" | "rtl" = "ltr";
  let lastOffset = 0;
  let lastTime = 0;
  let velocity = 0;
  let pointerId: number | null = null;
  let handle: HTMLElement | null = null;

  const onMove = (event: PointerEvent) => {
    if (pointerId === null || event.pointerId !== pointerId) return;
    const offset = outward(event.clientX, event.clientY, startX, startY);
    const dt = event.timeStamp - lastTime;
    if (dt > 0) velocity = (offset - lastOffset) / dt;
    lastOffset = offset;
    lastTime = event.timeStamp;
    dragOffset.value = Math.max(0, offset);
  };

  const detach = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
  };

  function end(event: PointerEvent) {
    if (pointerId === null || event.pointerId !== pointerId) return;
    detach();
    if (pointerId != null) handle?.releasePointerCapture?.(pointerId);
    pointerId = null;
    handle = null;
    dragging.value = false;

    const offset = Math.max(0, outward(event.clientX, event.clientY, startX, startY));
    if (sheet.shouldDismiss(offset, panelExtent, velocity)) dialog.setOpen(false);
    dragOffset.value = 0; // snap home (open) or reset for next time (closed)
  }

  const onHandlePointerDown = (event: PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const side = edge();
    const panel = dialog.panelRef.value;
    panelExtent =
      side === "top" || side === "bottom" ? (panel?.offsetHeight ?? 0) : (panel?.offsetWidth ?? 0);
    // Read when the drag starts, so a `dir` set above the panel counts.
    direction = panel && getComputedStyle(panel).direction === "rtl" ? "rtl" : "ltr";
    startX = event.clientX;
    startY = event.clientY;
    lastOffset = 0;
    lastTime = event.timeStamp;
    velocity = 0;
    pointerId = event.pointerId;
    handle = event.currentTarget as HTMLElement;
    handle.setPointerCapture?.(event.pointerId);
    dragging.value = true;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  onScopeDispose(detach);

  return { ...dialog, dragOffset, dragging, onHandlePointerDown };
}
