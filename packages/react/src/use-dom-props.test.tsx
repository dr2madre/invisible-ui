import { render } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";
import { useDomProps } from "./use-dom-props";

function Probe({ props }: { props: Record<string, unknown> }) {
  const ref = useRef<HTMLInputElement>(null);
  useDomProps(ref, props);
  return <input ref={ref} type="checkbox" aria-label="probe" />;
}

const input = (c: HTMLElement) => c.querySelector("input")!;

describe("useDomProps", () => {
  it("assigns declared properties onto the node", () => {
    const { container } = render(<Probe props={{ indeterminate: true }} />);
    expect(input(container).indeterminate).toBe(true);
  });

  it("reassigns when the declared value changes", () => {
    const { container, rerender } = render(<Probe props={{ indeterminate: true }} />);
    expect(input(container).indeterminate).toBe(true);

    rerender(<Probe props={{ indeterminate: false }} />);
    expect(input(container).indeterminate).toBe(false);
  });

  it("applies whatever the core declares, with no per-property knowledge", () => {
    // The point of the generic applier: a component gaining a new DOM-only
    // property needs no change here.
    const { container } = render(<Probe props={{ indeterminate: true, defaultChecked: true }} />);
    expect(input(container).indeterminate).toBe(true);
    expect(input(container).defaultChecked).toBe(true);
  });

  it("is a no-op for an empty bag", () => {
    const { container } = render(<Probe props={{}} />);
    expect(input(container).indeterminate).toBe(false);
  });
});
