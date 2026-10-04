import { useState, type DragEvent } from "react";

export interface UseDropAreaOptions {
  /** Ignore drags entirely (no highlight, no drop). */
  disabled?: boolean;
  /** Called with the DataTransfer of a successful drop. */
  onDrop?: (data: DataTransfer, event: DragEvent<HTMLElement>) => void;
  /** Called when the drag-over highlight toggles. */
  onDragChange?: (dragging: boolean) => void;
}

export interface UseDropArea {
  /** Whether a drag is currently over the target. */
  dragging: boolean;
  /** Spread onto the drop target: the drag handlers plus the `data-dragover` styling hook. */
  dropAreaProps: {
    "data-dragover": "" | undefined;
    onDragOver: (event: DragEvent<HTMLElement>) => void;
    onDragLeave: () => void;
    onDrop: (event: DragEvent<HTMLElement>) => void;
  };
}

/**
 * A generic drag-and-drop target. It wires the dragover, dragleave and drop
 * trio (with the `preventDefault` calls the drag-and-drop API requires),
 * reflects the state on a `data-dragover` attribute for styling, and hands the
 * raw `DataTransfer` to `onDrop`: files, tree nodes, list items, the payload
 * is the application's business. Reused by `UploadDropArea`, and attachable to
 * any element.
 *
 * A pointer-only enhancement by design: drag and drop has no keyboard or
 * assistive-technology contract, so always pair it with an accessible
 * alternative (UploadDropArea's click-to-browse input; a "move to" action on
 * a tree).
 */
export function useDropArea({
  disabled = false,
  onDrop,
  onDragChange,
}: UseDropAreaOptions = {}): UseDropArea {
  const [dragging, setDraggingState] = useState(false);

  const setDragging = (next: boolean) => {
    if (dragging === next) return;
    setDraggingState(next);
    onDragChange?.(next);
  };

  return {
    dragging: dragging && !disabled,
    dropAreaProps: {
      "data-dragover": dragging && !disabled ? "" : undefined,
      onDragOver: (event) => {
        if (disabled) return;
        event.preventDefault();
        setDragging(true);
      },
      onDragLeave: () => setDragging(false),
      onDrop: (event) => {
        event.preventDefault();
        setDragging(false);
        if (disabled) return;
        onDrop?.(event.dataTransfer, event);
      },
    },
  };
}
