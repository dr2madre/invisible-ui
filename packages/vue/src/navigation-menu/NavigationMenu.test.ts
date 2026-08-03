import { fireEvent, render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { NavigationMenu } from "./NavigationMenu";
import type { NavigationMenuItem } from "./use-navigation-menu";

// The panels teleport to document.body, so the axe scan covers the whole page;
// the landmark (region) rule judges the bare fixture's page structure, not the
// component, and is off here.
const noAxeRegion = { rules: { region: { enabled: false } } };

const items: NavigationMenuItem[] = [
  {
    value: "products",
    label: "Products",
    links: [
      { label: "Analytics", href: "#analytics", description: "Understand your traffic." },
      { label: "Automation", href: "#automation", description: "Automate your workflow." },
    ],
  },
  {
    value: "company",
    label: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Careers", href: "#careers" },
    ],
  },
  { value: "pricing", label: "Pricing", href: "#pricing" },
];

const renderNav = (props: Record<string, unknown> = {}) =>
  render(NavigationMenu, { props: { label: "Main", items, ...props } });

const trigger = (name: string) => screen.getByRole("button", { name });

describe("Vue NavigationMenu (styled)", () => {
  it("renders a nav landmark with triggers and plain links", () => {
    renderNav();
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("link", { name: "Pricing" })).toHaveAttribute("href", "#pricing");
  });

  it("opens a panel on click and reveals its links", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderNav({ onValueChange });

    await user.click(trigger("Products"));
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "true");
    expect(onValueChange).toHaveBeenLastCalledWith("products");
    expect(screen.getByRole("link", { name: /Analytics/ })).toBeInTheDocument();
  });

  it("labels the panel with its trigger", async () => {
    const user = userEvent.setup();
    renderNav();
    await user.click(trigger("Products"));
    const panel = document.querySelector(".navmenu__content")!;
    expect(panel.getAttribute("aria-labelledby")).toBe(trigger("Products").id);
    expect(trigger("Products").getAttribute("aria-controls")).toBe(panel.id);
  });

  it("switches panels immediately on hover while open", async () => {
    const user = userEvent.setup();
    renderNav();

    await user.click(trigger("Products"));
    await fireEvent.pointerEnter(trigger("Company"));
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("Company")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /About/ })).toBeInTheDocument();
  });

  it("opens with ArrowDown and moves focus into the panel", async () => {
    const user = userEvent.setup();
    renderNav();

    trigger("Products").focus();
    await user.keyboard("{ArrowDown}");
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /Analytics/ })).toHaveFocus();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderNav();

    trigger("Products").focus();
    await user.keyboard("{ArrowDown}"); // open, focus the first link
    await user.keyboard("{Escape}");
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("Products")).toHaveFocus();
  });

  it("closes on an outside press", async () => {
    const user = userEvent.setup();
    renderNav();

    await user.click(trigger("Products"));
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "true");
    await fireEvent.pointerDown(document.body);
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
  });

  it("has no accessibility violations, closed and open", async () => {
    const user = userEvent.setup();
    renderNav();
    expect(await axe(document.body, noAxeRegion)).toHaveNoViolations();

    await user.click(trigger("Products"));
    expect(await axe(document.body, noAxeRegion)).toHaveNoViolations();
  });
});
