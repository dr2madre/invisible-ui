import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Fixture from "./dom-props.fixture.svelte";

const input = () => screen.getByRole("checkbox") as HTMLInputElement;

describe("domProps action", () => {
  it("assigns declared properties onto the node", () => {
    render(Fixture, { bag: { indeterminate: true } });
    expect(input().indeterminate).toBe(true);
  });

  it("reassigns when the declared value changes", async () => {
    const { rerender } = render(Fixture, { bag: { indeterminate: true } });
    expect(input().indeterminate).toBe(true);

    await rerender({ bag: { indeterminate: false } });
    expect(input().indeterminate).toBe(false);
  });

  it("applies whatever the core declares, with no per-property knowledge", () => {
    // The point of the generic applier: a component gaining a new DOM-only
    // property needs no change here.
    render(Fixture, { bag: { indeterminate: true, defaultChecked: true } });
    expect(input().indeterminate).toBe(true);
    expect(input().defaultChecked).toBe(true);
  });

  it("is a no-op for an empty bag", () => {
    render(Fixture, { bag: {} });
    expect(input().indeterminate).toBe(false);
  });
});
