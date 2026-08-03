import { computed, ref, toValue, type ComputedRef, type MaybeRefOrGetter, type Ref } from "vue";

export interface UseDropAreaOptions {
  /** Ignore drags entirely (no highlight, no drop). */
  disabled?: boolean;
  /** Called with the DataTransfer of a successful drop. */
  onDrop?: (data: DataTransfer, event: DragEvent) => void;
  /** Called when the drag-over highlight toggles. */
  onDragChange?: (dragging: boolean) => void;
}

export interface UseDropArea {
  /** Whether a drag is currently over the target. */
  dragging: Ref<boolean>;
  /** Spread onto the drop target: the drag listeners plus the `data-dragover` styling hook. */
  dropAreaProps: ComputedRef<Record<string, unknown>>;
}

/**
 * useDropArea — a generic drag-and-drop target. It wires the dragover /
 * dragleave / drop trio (with the `preventDefault` dance the DnD API requires),
 * reflects the state on a `data-dragover` attribute for styling, and hands the
 * raw `DataTransfer` to `onDrop`: files, tree nodes, list items, the payload is
 * the application's business. Reused by `UploadDropArea` and attachable to any
 * element (a TreeView item, a kanban column).
 *
 * Pointer-only *enhancement* by design: drag-and-drop has no keyboard or
 * assistive-tech contract, so always pair it with an accessible alternative
 * (UploadDropArea's click-to-browse input; a "move to…" action on a tree).
 */
export function useDropArea(options: MaybeRefOrGetter<UseDropAreaOptions> = {}): UseDropArea {
  const resolved = computed(() => toValue(options));
  const dragging = ref(false);

  const setDragging = (next: boolean) => {
    if (dragging.value === next) return;
    dragging.value = next;
    resolved.value.onDragChange?.(next);
  };

  const onDragover = (event: DragEvent) => {
    if (resolved.value.disabled) return;
    event.preventDefault();
    setDragging(true);
  };

  const onDragleave = () => setDragging(false);

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    if (resolved.value.disabled) return;
    if (event.dataTransfer) resolved.value.onDrop?.(event.dataTransfer, event);
  };

  const dropAreaProps = computed(() => ({
    "data-dragover": dragging.value && !resolved.value.disabled ? "" : undefined,
    onDragover,
    onDragleave,
    onDrop,
  }));

  return { dragging, dropAreaProps };
}
