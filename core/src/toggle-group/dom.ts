/**
 * The toggle group's rule applied to the page. `manage` takes the group
 * element, finds its toggles, writes their tab stops, answers the keys, and
 * follows toggles that are added, removed or disabled later. It sets no
 * style and renders nothing: the adapter renders the group and its toggles.
 */
import type { ToolbarOrientation } from "../toolbar";
import { move, refocusIndex, roves, tabStop } from "./rule";

export interface ManageOptions {
  /**
   * The group's layout axis, read each time a key arrives, so a change needs
   * no new call. Defaults to horizontal.
   */
  orientation?: () => ToolbarOrientation;
  /** Which descendants are toggles. Defaults to `button.toggle`. */
  selector?: string;
}

/**
 * Toggles whose tabindex the group wrote, per group element. It outlives a
 * teardown, so a group taken out of the page and put back still gives back
 * only the tab stops it set.
 */
const written = /* @__PURE__ */ new WeakMap<Element, Set<HTMLElement>>();

/** Group elements being managed: a nested group owns its own toggles. */
const groups = /* @__PURE__ */ new WeakSet<Element>();

/**
 * Apply the toggle group rule to `root` and keep it applied. Call it once the
 * group is in the page; it returns the teardown. On the server nothing calls
 * it, so every toggle is its own tab stop until the group mounts.
 */
export function manage(root: HTMLElement, options: ManageOptions = {}): () => void {
  const { orientation = () => "horizontal", selector = "button.toggle" } = options;
  const doc = root.ownerDocument;
  let managed = written.get(root);
  if (!managed) written.set(root, (managed = new Set()));
  const own = managed;
  groups.add(root);

  // The toggle focused last and its index: which toggle keeps the tab stop,
  // and where focus goes when that toggle is removed.
  let last: HTMLButtonElement | null = null;
  let lastIndex = -1;
  // Whether focus is still in the group, as far as it can tell: a toggle
  // removed while focused takes focus with it and fires nothing reliable.
  let holdsFocus = false;

  /** The nearest managed group around `el`, or `null`. */
  const groupOf = (el: Element): Element | null => {
    for (let node = el.parentElement; node; node = node.parentElement) {
      if (node === root || groups.has(node)) return node;
    }
    return null;
  };

  /** The group's own toggles, not those of a group nested in it, in order. */
  const toggles = (): HTMLButtonElement[] =>
    Array.from(root.querySelectorAll<HTMLButtonElement>(selector)).filter(
      (el) => groupOf(el) === root,
    );

  /** A toolbar around the group owns the keys and the tab stop. */
  const inToolbar = () => root.parentElement?.closest('[role="toolbar"]') != null;

  const roving = (list: HTMLButtonElement[]) =>
    roves({ count: list.length, inToolbar: inToolbar() });

  const disabledOf = (list: HTMLButtonElement[]) => list.map((el) => el.disabled);

  const setTabStop = (list: HTMLButtonElement[], stop: number) => {
    list.forEach((el, index) => {
      el.tabIndex = index === stop ? 0 : -1;
      own.add(el);
    });
  };

  /** Give each toggle its own tab stop back. */
  const release = () => {
    for (const el of own) el.removeAttribute("tabindex");
    own.clear();
  };

  // Toggles can be added, removed or disabled after mount: the count decides
  // whether the group is one tab stop, and focus is never lost.
  const reconcile = () => {
    const list = toggles();
    if (last) {
      const kept = list.indexOf(last);
      if (kept !== -1) {
        // Toggles added before it shift its index.
        lastIndex = kept;
      } else {
        last = null;
        const active = doc.activeElement;
        if (holdsFocus && (active === null || active === doc.body)) {
          const target = list[refocusIndex({ lastIndex, count: list.length })];
          if (target) {
            last = target;
            lastIndex = list.indexOf(target);
            target.focus();
          }
        } else {
          holdsFocus = false;
        }
      }
    }

    if (inToolbar()) {
      // The toolbar owns every tabindex now.
      own.clear();
      return;
    }
    // A toggle that left the group gets its own tab stop back.
    for (const el of own) {
      if (!list.includes(el as HTMLButtonElement)) {
        el.removeAttribute("tabindex");
        own.delete(el);
      }
    }
    if (!roves({ count: list.length, inToolbar: false })) {
      release();
      return;
    }
    setTabStop(
      list,
      tabStop({
        disabled: disabledOf(list),
        focused: list.indexOf(doc.activeElement as HTMLButtonElement),
        // After the last focused toggle left, its place keeps the tab stop.
        last: lastIndex,
      }),
    );
  };

  const onKeydown = (event: KeyboardEvent) => {
    const list = toggles();
    if (!roving(list)) return;
    const index = list.indexOf(event.target as HTMLButtonElement);
    if (index === -1) return;
    const view = doc.defaultView;
    const next = move({
      key: event.key,
      index,
      disabled: disabledOf(list),
      orientation: orientation(),
      direction: view?.getComputedStyle(root).direction === "rtl" ? "rtl" : "ltr",
    });
    if (next === null) return;
    event.preventDefault();
    setTabStop(list, next);
    list[next]!.focus();
  };

  const onFocusin = (event: FocusEvent) => {
    const list = toggles();
    const index = list.indexOf(event.target as HTMLButtonElement);
    if (index === -1) return;
    last = list[index]!;
    lastIndex = index;
    holdsFocus = true;
    if (roving(list)) setTabStop(list, index);
  };

  // Focus left for somewhere else, unless the toggle left with it: a toggle
  // still in the page means the user moved on, so a later removal must not
  // pull focus back. A removed toggle is disconnected by the time the check
  // runs, whichever runs first of it and the removal's own reconcile.
  const onFocusout = (event: FocusEvent) => {
    const to = event.relatedTarget as Node | null;
    if (to && root.contains(to)) return;
    const from = event.target as Element;
    queueMicrotask(() => {
      if (from.isConnected && !root.contains(doc.activeElement)) holdsFocus = false;
    });
  };

  reconcile();
  const observer = new MutationObserver(reconcile);
  observer.observe(root, { childList: true, subtree: true, attributeFilter: ["disabled"] });
  root.addEventListener("keydown", onKeydown);
  root.addEventListener("focusin", onFocusin);
  root.addEventListener("focusout", onFocusout);

  return () => {
    observer.disconnect();
    root.removeEventListener("keydown", onKeydown);
    root.removeEventListener("focusin", onFocusin);
    root.removeEventListener("focusout", onFocusout);
    groups.delete(root);
  };
}
