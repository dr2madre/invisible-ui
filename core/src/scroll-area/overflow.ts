/**
 * Report whether a scroll container's content is wider than the container.
 *
 * A scroller that overflows must be reachable from the keyboard (WCAG 2.1.1),
 * and one that does not must stay out of the tab order, so an adapter turns
 * `tabindex="0"` on and off with this. `onChange` runs once with the first
 * measure and again each time the answer flips. The container and its
 * children are observed, so a resize of either one is seen. Returns the
 * function that stops observing.
 */
export function observeInlineOverflow(
  node: HTMLElement,
  onChange: (overflowing: boolean) => void,
): () => void {
  let last: boolean | null = null;
  const measure = () => {
    const next = node.scrollWidth > node.clientWidth;
    if (next === last) return;
    last = next;
    onChange(next);
  };
  measure();
  if (typeof ResizeObserver === "undefined") return () => {};
  const observer = new ResizeObserver(measure);
  observer.observe(node);
  for (const child of Array.from(node.children)) observer.observe(child);
  return () => observer.disconnect();
}
