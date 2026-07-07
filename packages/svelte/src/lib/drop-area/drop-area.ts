import type { Action } from "svelte/action";

export interface DropAreaOptions {
  /** Ignore drags entirely (no highlight, no drop). */
  disabled?: boolean;
  /** Called with the DataTransfer of a successful drop. */
  onDrop?: (data: DataTransfer, event: DragEvent) => void;
  /** Called when the drag-over highlight toggles. */
  onDragChange?: (dragging: boolean) => void;
}

/**
 * dropArea — a generic drag-and-drop target, as a Svelte action. It wires the
 * dragover / dragleave / drop trio (with the `preventDefault` dance the DnD
 * API requires), reflects the state on a `data-dragover` attribute for
 * styling, and hands the raw `DataTransfer` to `onDrop` — files, tree nodes,
 * list items: the payload is the application's business. Reused by the
 * UploadDropArea; attachable to any element (a TreeView item, a kanban
 * column…).
 *
 * Pointer-only *enhancement* by design: drag-and-drop has no keyboard or
 * assistive-tech contract, so always pair it with an accessible alternative
 * (UploadDropArea's click-to-browse input; a "move to…" action on a tree).
 */
export const dropArea: Action<HTMLElement, DropAreaOptions | undefined> = (node, options) => {
  let opts = options ?? {};
  let dragging = false;

  const setDragging = (next: boolean) => {
    if (dragging === next) return;
    dragging = next;
    if (next) node.setAttribute("data-dragover", "");
    else node.removeAttribute("data-dragover");
    opts.onDragChange?.(next);
  };

  const onDragOver = (event: DragEvent) => {
    if (opts.disabled) return;
    event.preventDefault();
    setDragging(true);
  };
  const onDragLeave = () => setDragging(false);
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    if (opts.disabled) return;
    if (event.dataTransfer) opts.onDrop?.(event.dataTransfer, event);
  };

  node.addEventListener("dragover", onDragOver);
  node.addEventListener("dragleave", onDragLeave);
  node.addEventListener("drop", onDrop);

  return {
    update(next) {
      opts = next ?? {};
      if (opts.disabled) setDragging(false);
    },
    destroy() {
      node.removeEventListener("dragover", onDragOver);
      node.removeEventListener("dragleave", onDragLeave);
      node.removeEventListener("drop", onDrop);
    },
  };
};
