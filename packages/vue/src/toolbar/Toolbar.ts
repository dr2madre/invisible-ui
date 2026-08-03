import { defineComponent, h, onMounted, ref, type PropType } from "vue";

export type ToolbarOrientation = "horizontal" | "vertical";

export interface ToolbarProps {
  /** Accessible name for the toolbar (required). */
  label: string;
  orientation?: ToolbarOrientation;
  /**
   * Flat presentation: the controls inside lose their individual borders and
   * fill at rest (they read as one group, divided only by separators), with a
   * subtle hover overlay. The toolbar's own frame still groups them.
   */
  flat?: boolean;
}

const FOCUSABLE =
  'button, [role="button"], [role="checkbox"], [role="radio"], [role="switch"], a[href], input, select, textarea';

/**
 * Toolbar — a grouping container (WAI-ARIA `role="toolbar"`) for a set of
 * related controls (buttons, toggle buttons), optionally divided into groups
 * with `Separator`. Ported from the Svelte adapter.
 *
 * Implements the toolbar keyboard pattern: a single tab stop (roving tabindex)
 * and arrow-key navigation between controls, Left/Right for a horizontal
 * toolbar and Up/Down for a vertical one, plus Home/End, wrapping at the ends.
 * Tab moves into and out of the whole toolbar.
 *
 * A `label` is required (the toolbar needs an accessible name). Layout gap is
 * themeable via `--ds-toolbar-gap`.
 */
export const Toolbar = defineComponent({
  name: "Toolbar",
  props: {
    label: { type: String, required: true },
    orientation: { type: String as PropType<ToolbarOrientation>, default: "horizontal" },
    flat: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    const root = ref<HTMLElement | null>(null);

    /** The enabled controls that belong directly to this toolbar, in DOM order. */
    const items = (): HTMLElement[] => {
      const node = root.value;
      if (!node) return [];
      return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) =>
          el.closest('[role="toolbar"]') === node &&
          !el.hasAttribute("disabled") &&
          el.getAttribute("aria-disabled") !== "true",
      );
    };

    /** Make `index` the single tab stop; everything else leaves the Tab order. */
    const setTabStop = (list: HTMLElement[], index: number) => {
      list.forEach((el, i) => (el.tabIndex = i === index ? 0 : -1));
    };

    const focusAt = (index: number) => {
      const list = items();
      if (list.length === 0) return;
      const wrapped = (index + list.length) % list.length;
      setTabStop(list, wrapped);
      list[wrapped]!.focus();
    };

    const onKeydown = (event: KeyboardEvent) => {
      const horizontal = props.orientation === "horizontal";
      const list = items();
      const current = list.indexOf(document.activeElement as HTMLElement);
      if (current === -1) return;

      switch (event.key) {
        case horizontal ? "ArrowRight" : "ArrowDown":
          event.preventDefault();
          focusAt(current + 1);
          break;
        case horizontal ? "ArrowLeft" : "ArrowUp":
          event.preventDefault();
          focusAt(current - 1);
          break;
        case "Home":
          event.preventDefault();
          focusAt(0);
          break;
        case "End":
          event.preventDefault();
          focusAt(list.length - 1);
          break;
      }
    };

    /** Keep the most recently focused control as the single tab stop. */
    const onFocusin = (event: FocusEvent) => {
      const list = items();
      const index = list.indexOf(event.target as HTMLElement);
      if (index >= 0) setTabStop(list, index);
    };

    // The initial roving tab stop lands once the children are in the DOM.
    onMounted(() => {
      const list = items();
      if (list.length) setTabStop(list, 0);
    });

    return () =>
      h(
        "div",
        {
          ref: root,
          class: "toolbar",
          role: "toolbar",
          "aria-label": props.label,
          "aria-orientation": props.orientation,
          "data-orientation": props.orientation,
          "data-flat": props.flat ? "" : undefined,
          onKeydown,
          onFocusin,
        },
        slots.default?.(),
      );
  },
});
