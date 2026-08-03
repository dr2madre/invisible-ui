import { defineComponent, h, type PropType } from "vue";
import { useScrollArea, type ScrollOrientation } from "./use-scroll-area";

export interface ScrollAreaProps {
  /** Which axes scroll. Defaults to `vertical`. */
  orientation?: ScrollOrientation;
  /** Max size of the viewport (the scroll constraint), e.g. `"12rem"`. */
  maxHeight?: string;
  /** Optional accessible name; makes the viewport a labelled scroll region. */
  label?: string;
}

/** Per-orientation overflow rules for the viewport. */
const OVERFLOW: Record<ScrollOrientation, Record<string, string>> = {
  vertical: { overflowY: "auto", overflowX: "hidden" },
  horizontal: { overflowX: "auto", overflowY: "hidden" },
  both: { overflow: "auto" },
};

/**
 * ScrollArea — a scrollable viewport with custom overlay scrollbars, ported
 * from the Svelte adapter. The scrollbar geometry comes from the headless
 * scroll area (`@design-system/core`); this layer measures the viewport (scroll
 * plus ResizeObserver) and supports dragging the thumb. Native scrollbars are
 * hidden while native keyboard and wheel scrolling stay intact (the focusable
 * viewport scrolls with the arrow keys).
 *
 * Put the scrolling content in the default slot. Themeable via
 * `--ds-scroll-area-*`.
 */
export const ScrollArea = defineComponent({
  name: "ScrollArea",
  props: {
    orientation: { type: String as PropType<ScrollOrientation>, default: "vertical" },
    maxHeight: { type: String, default: "12rem" },
    label: { type: String, default: undefined },
  },
  setup(props, { slots }) {
    const { viewportRef, vertical, horizontal, onThumbPointerDown } = useScrollArea();

    return () => {
      const showVertical = props.orientation === "vertical" || props.orientation === "both";
      const showHorizontal = props.orientation === "horizontal" || props.orientation === "both";

      return h("div", { class: "scroll-area", "data-orientation": props.orientation }, [
        h(
          "div",
          {
            class: "scroll-area__viewport",
            ref: viewportRef,
            tabindex: "0",
            role: props.label ? "region" : undefined,
            "aria-label": props.label,
            style: { maxBlockSize: props.maxHeight, ...OVERFLOW[props.orientation] },
          },
          slots.default?.(),
        ),

        showVertical && vertical.value.overflow
          ? h("div", { class: "scroll-area__bar scroll-area__bar--v", "aria-hidden": "true" }, [
              h("div", {
                class: "scroll-area__thumb",
                style: {
                  blockSize: `${vertical.value.sizeFraction * 100}%`,
                  insetBlockStart: `${vertical.value.offsetFraction * 100}%`,
                },
                onPointerdown: (event: PointerEvent) => onThumbPointerDown("vertical", event),
              }),
            ])
          : null,

        showHorizontal && horizontal.value.overflow
          ? h("div", { class: "scroll-area__bar scroll-area__bar--h", "aria-hidden": "true" }, [
              h("div", {
                class: "scroll-area__thumb",
                style: {
                  inlineSize: `${horizontal.value.sizeFraction * 100}%`,
                  insetInlineStart: `${horizontal.value.offsetFraction * 100}%`,
                },
                onPointerdown: (event: PointerEvent) => onThumbPointerDown("horizontal", event),
              }),
            ])
          : null,
      ]);
    };
  },
});
