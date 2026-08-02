import { render } from "@testing-library/vue";
import { defineComponent, h, ref, type PropType } from "vue";
import { describe, expect, it } from "vitest";
import { useDomProps } from "./use-dom-props";

const Probe = defineComponent({
  name: "Probe",
  props: {
    domProps: { type: Object as PropType<Record<string, unknown>>, required: true },
  },
  setup(props) {
    const input = ref<HTMLInputElement | null>(null);
    useDomProps(input, () => props.domProps);
    return () => h("input", { ref: input, type: "checkbox", "aria-label": "probe" });
  },
});

const input = (c: Element) => c.querySelector("input")!;

describe("useDomProps", () => {
  it("assigns declared properties onto the node", () => {
    const { container } = render(Probe, { props: { domProps: { indeterminate: true } } });
    expect(input(container).indeterminate).toBe(true);
  });

  it("reassigns when the declared value changes", async () => {
    const { container, rerender } = render(Probe, {
      props: { domProps: { indeterminate: true } },
    });
    expect(input(container).indeterminate).toBe(true);

    await rerender({ domProps: { indeterminate: false } });
    expect(input(container).indeterminate).toBe(false);
  });

  it("applies whatever the core declares, with no per-property knowledge", () => {
    // The point of the generic applier: a component gaining a new DOM-only
    // property needs no change here.
    const { container } = render(Probe, {
      props: { domProps: { indeterminate: true, defaultChecked: true } },
    });
    expect(input(container).indeterminate).toBe(true);
    expect(input(container).defaultChecked).toBe(true);
  });

  it("is a no-op for an empty bag", () => {
    const { container } = render(Probe, { props: { domProps: {} } });
    expect(input(container).indeterminate).toBe(false);
  });
});
