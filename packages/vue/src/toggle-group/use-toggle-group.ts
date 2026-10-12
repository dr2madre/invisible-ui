import { toggleGroup as core } from "@design-system/core";
import { onBeforeUnmount, onMounted, type Ref } from "vue";

export interface UseToggleGroupOptions {
  /** The group container. */
  root: Ref<HTMLElement | null>;
  /** Layout axis, read when a key arrives. */
  orientation: () => "horizontal" | "vertical";
}

export interface ToggleGroupHandlers {
  onKeydown: (event: KeyboardEvent) => void;
  onFocusin: (event: FocusEvent) => void;
  onFocusout: (event: FocusEvent) => void;
}

/**
 * The toggle group's keyboard rule from `core.toggleGroup`, applied to the
 * `button.toggle` elements in the container: one tab stop with arrow keys from
 * three toggles up, outside a toolbar. Finding the toggles and moving real
 * focus stay here; the count is read again on every DOM change.
 */
export function useToggleGroup({ root, orientation }: UseToggleGroupOptions): ToggleGroupHandlers {
  /** Whether the group set the toggles' tabindex, so it only clears its own. */
  let managed = false;
  let lastIndex = -1;
  let lastToggle: HTMLElement | null = null;
  /** Whether focus is on a toggle, so a removal may hand it to a neighbour. */
  let holdsFocus = false;

  const toggles = (): HTMLButtonElement[] => {
    const node = root.value;
    if (!node) return [];
    return Array.from(node.querySelectorAll<HTMLButtonElement>("button.toggle")).filter(
      (el) => el.parentElement?.closest(".toggle-group") === node,
    );
  };

  const inToolbar = () => Boolean(root.value?.parentElement?.closest('[role="toolbar"]'));

  const roving = (list: HTMLButtonElement[]) =>
    core.roves({ count: list.length, inToolbar: inToolbar() });

  const setTabStop = (list: HTMLButtonElement[], stop: number) => {
    managed = true;
    list.forEach((el, index) => (el.tabIndex = index === stop ? 0 : -1));
  };

  const reconcile = () => {
    const list = toggles();
    // Inside a toolbar the toolbar owns the tab stop and the keys.
    if (inToolbar()) return;

    // Toggles added before the last focused one shift its index.
    const kept = lastToggle ? list.indexOf(lastToggle as HTMLButtonElement) : -1;
    if (kept !== -1) lastIndex = kept;

    const active = document.activeElement;
    if (holdsFocus && (active === null || active === document.body)) {
      const back =
        kept !== -1 ? list[kept] : list[core.refocusIndex({ lastIndex, count: list.length })];
      back?.focus();
    }

    if (core.roves({ count: list.length, inToolbar: false })) {
      const stop = core.tabStop({
        disabled: list.map((el) => el.disabled),
        focused: list.indexOf(document.activeElement as HTMLButtonElement),
        last: lastIndex,
      });
      setTabStop(list, stop);
    } else if (managed) {
      for (const el of list) el.removeAttribute("tabindex");
      managed = false;
    }
  };

  const onFocusin = (event: FocusEvent) => {
    const list = toggles();
    const index = list.indexOf(event.target as HTMLButtonElement);
    if (index === -1) return;
    holdsFocus = true;
    lastIndex = index;
    lastToggle = list[index]!;
    if (roving(list)) setTabStop(list, index);
  };

  const onFocusout = (event: FocusEvent) => {
    const next = event.relatedTarget as Node | null;
    if (next && root.value?.contains(next)) return;
    const target = event.target as HTMLElement;
    // A toggle removed while focused may blur on its way out; that focus is
    // still the group's to hand on, so only a blur that leaves it connected
    // counts as leaving. The DOM change handler runs before this check.
    queueMicrotask(() => {
      if (target.isConnected) holdsFocus = false;
    });
  };

  const onKeydown = (event: KeyboardEvent) => {
    const list = toggles();
    if (!roving(list)) return;
    const index = list.indexOf(event.target as HTMLButtonElement);
    if (index === -1) return;
    const node = root.value;
    const next = core.move({
      key: event.key,
      index,
      disabled: list.map((el) => el.disabled),
      orientation: orientation(),
      direction: node && getComputedStyle(node).direction === "rtl" ? "rtl" : "ltr",
    });
    if (next === null) return;
    event.preventDefault();
    setTabStop(list, next);
    list[next]!.focus();
  };

  let observer: MutationObserver | undefined;
  onMounted(() => {
    reconcile();
    observer = new MutationObserver(reconcile);
    observer.observe(root.value!, {
      childList: true,
      subtree: true,
      attributeFilter: ["disabled"],
    });
  });
  onBeforeUnmount(() => observer?.disconnect());

  return { onKeydown, onFocusin, onFocusout };
}
