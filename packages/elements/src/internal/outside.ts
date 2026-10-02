export interface OutsideOptions {
  /** Also close when focus lands outside every part. */
  focus?: boolean;
}

/**
 * Call `close` when a pointer goes down outside every one of `parts` and, with
 * `focus`, when focus lands outside them. The press is heard in the capture
 * phase, so a handler that stops propagation cannot keep the overlay open.
 * Returns the cleanup that stops listening.
 */
export function onOutside(
  parts: Node[],
  close: () => void,
  { focus = false }: OutsideOptions = {},
): () => void {
  const doc = parts[0]?.ownerDocument ?? document;
  const listener = (event: Event) => {
    const target = event.target as Node;
    if (!parts.some((part) => part.contains(target))) close();
  };
  doc.addEventListener("pointerdown", listener, true);
  if (focus) doc.addEventListener("focusin", listener);
  return () => {
    doc.removeEventListener("pointerdown", listener, true);
    if (focus) doc.removeEventListener("focusin", listener);
  };
}
