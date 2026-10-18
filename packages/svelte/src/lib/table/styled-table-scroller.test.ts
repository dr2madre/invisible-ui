import { render, screen } from "@testing-library/svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./table-set.fixture.svelte";

// jsdom has no layout: the measure comes from these two getters.
const measure = (scrollWidth: number, clientWidth: number) => {
  vi.spyOn(Element.prototype, "scrollWidth", "get").mockReturnValue(scrollWidth);
  vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(clientWidth);
};

const card = () => document.querySelector<HTMLElement>(".table-view__card")!;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Svelte TableSet: a table wider than its card", () => {
  it("scrolls inside a focusable region named after the title", async () => {
    measure(900, 300);
    const { container } = render(Fixture);
    expect(card()).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("region", { name: "People" })).toBe(card());
    expect(await axe(container)).toHaveNoViolations();
  });

  it("stays out of the tab order while the table fits", async () => {
    measure(300, 300);
    const { container } = render(Fixture);
    expect(card()).not.toHaveAttribute("tabindex");
    expect(card()).not.toHaveAttribute("role");
    expect(card()).not.toHaveAttribute("aria-label");
    expect(await axe(container)).toHaveNoViolations();
  });
});
