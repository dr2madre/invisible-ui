import { screen } from "@testing-library/dom";
import { afterEach, vi } from "vitest";
import { axe } from "vitest-axe";
import "../define";
import { mountSet } from "./table-set.fixture";

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

// jsdom has no layout: the measure comes from these two getters.
const measure = (scrollWidth: number, clientWidth: number) => {
  vi.spyOn(Element.prototype, "scrollWidth", "get").mockReturnValue(scrollWidth);
  vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(clientWidth);
};

const card = () => document.querySelector<HTMLElement>(".table-view__card")!;

describe("<ds-table-set> a table wider than its card", () => {
  it("scrolls inside a focusable region named after the heading", async () => {
    measure(900, 300);
    mountSet();
    expect(card()).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("region", { name: "People" })).toBe(card());
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("names the region after the caption without a heading", () => {
    measure(900, 300);
    mountSet({ attrs: { heading: null, caption: "Staff" } });
    expect(screen.getByRole("region", { name: "Staff" })).toBe(card());
  });

  it("stays out of the tab order while the table fits", async () => {
    measure(300, 300);
    mountSet();
    expect(card()).not.toHaveAttribute("tabindex");
    expect(card()).not.toHaveAttribute("role");
    expect(card()).not.toHaveAttribute("aria-label");
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
