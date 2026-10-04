import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
  type Placement,
  type VirtualElement,
} from "@floating-ui/react-dom";

export type { Placement };

export interface FloatingOptions {
  /** Preferred placement; flips when there is no room. Default `"bottom-start"`. */
  placement?: Placement;
  /** Gap between anchor and floating element, in px. Default `4`. */
  offset?: number;
  /** Viewport padding kept by flip and shift, in px. Default `8`. */
  padding?: number;
  /** Match the floating element's minimum width to the anchor's width. */
  sameWidth?: boolean;
}

/**
 * Position `floating` against `anchor` once, with Floating UI (flip and
 * shift). The anchor can be a virtual element, such as the point a context
 * menu opens at. Writes `left` and `top`, for an element with a fixed position.
 */
export function positionFloating(
  anchor: Element | VirtualElement,
  floating: HTMLElement,
  { placement = "bottom-start", offset: gap = 4, padding = 8 }: FloatingOptions = {},
): void {
  void computePosition(anchor, floating, {
    placement,
    strategy: "fixed",
    middleware: [offset(gap), flip({ padding }), shift({ padding })],
  }).then(({ x, y }) => {
    floating.style.left = `${x}px`;
    floating.style.top = `${y}px`;
  });
}

/**
 * Position `floating` against `anchor` and keep it positioned on scroll and
 * resize until the returned cleanup runs: the overlay positioning of this
 * adapter, the counterpart of `attachFloating` in the other web adapters.
 * Without `ResizeObserver` (jsdom) it positions once.
 */
export function attachFloating(
  anchor: HTMLElement,
  floating: HTMLElement,
  options: FloatingOptions = {},
): () => void {
  const update = () => {
    if (options.sameWidth) floating.style.minWidth = `${anchor.offsetWidth}px`;
    positionFloating(anchor, floating, options);
  };
  if (typeof ResizeObserver !== "undefined") return autoUpdate(anchor, floating, update);
  update();
  return () => {};
}

/** A zero-size anchor at a viewport point. */
export const pointAnchor = (x: number, y: number): VirtualElement => ({
  getBoundingClientRect: () => ({
    x,
    y,
    width: 0,
    height: 0,
    top: y,
    left: x,
    right: x,
    bottom: y,
  }),
});

/**
 * Call `onDismiss` on a pointer press outside every element `inside` returns.
 * Read at each press, so elements mounted after the call count. Listens in the
 * capture phase; returns the cleanup.
 */
export function onOutsidePointerDown(
  inside: () => (Element | null | undefined)[],
  onDismiss: () => void,
): () => void {
  const handler = (event: Event) => {
    const target = event.target as Node;
    if (inside().some((el) => el?.contains(target))) return;
    onDismiss();
  };
  document.addEventListener("pointerdown", handler, true);
  return () => document.removeEventListener("pointerdown", handler, true);
}

/**
 * Swallow the duplicate click some touch browsers (iOS Safari) synthesize
 * shortly after a tap, so a trigger that toggles does not open and close at
 * once. It arms only after a touch press; mouse and keyboard clicks always
 * pass. Returns the cleanup.
 */
export function ignoreGhostClicks(node: HTMLElement, windowMs = 350): () => void {
  let lastTouchClick = -Infinity;
  let pointerType = "";
  const onPointerDown = (event: PointerEvent) => {
    pointerType = event.pointerType;
  };
  const onClick = (event: MouseEvent) => {
    if (event.timeStamp - lastTouchClick < windowMs) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return;
    }
    if (pointerType === "touch") lastTouchClick = event.timeStamp;
    pointerType = "";
  };
  node.addEventListener("pointerdown", onPointerDown, true);
  node.addEventListener("click", onClick, true);
  return () => {
    node.removeEventListener("pointerdown", onPointerDown, true);
    node.removeEventListener("click", onClick, true);
  };
}
