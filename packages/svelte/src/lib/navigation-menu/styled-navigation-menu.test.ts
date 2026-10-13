import { fireEvent, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./navigation-menu.fixture.svelte";
import Dynamic from "./navigation-menu-dynamic.fixture.svelte";
import NavigationMenu from "./NavigationMenu.svelte";

const trigger = (name: string) => screen.getByRole("button", { name });

describe("Svelte NavigationMenu (styled)", () => {
  it("keeps a pending hover when another item goes away", async () => {
    const { rerender } = render(Dynamic);
    const products = screen.getByRole("button", { name: "Products" });
    await fireEvent.pointerEnter(products);
    // The second item is dropped while the first item's hover is still
    // waiting: the timers belong to the menu, so this used to cancel it.
    await rerender({ dropLast: true });
    // Past the component's 150ms hover delay.
    await new Promise((resolve) => setTimeout(resolve, 220));
    expect(products).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps a panel closed by click closed when the hover delay runs out", async () => {
    vi.useFakeTimers();
    try {
      render(Fixture);
      const products = trigger("Products");
      // A pointer click hovers the trigger first, which starts the open delay.
      await fireEvent.pointerEnter(products, { pointerType: "mouse" });
      await fireEvent.click(products);
      expect(products).toHaveAttribute("aria-expanded", "true");
      await fireEvent.click(products);
      expect(products).toHaveAttribute("aria-expanded", "false");
      await vi.advanceTimersByTimeAsync(150);
      expect(products).toHaveAttribute("aria-expanded", "false");
    } finally {
      vi.useRealTimers();
    }
  });

  it("renders a nav landmark with triggers and plain links", () => {
    render(Fixture);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("link", { name: "Pricing" })).toHaveAttribute("href", "#pricing");
  });

  it("opens a panel on click and reveals its links", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Fixture, { props: { onValueChange } });

    await user.click(trigger("Products"));
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "true");
    expect(onValueChange).toHaveBeenLastCalledWith("products");
    expect(screen.getByRole("link", { name: /Analytics/ })).toBeInTheDocument();
  });

  it("switches panels immediately on hover while open", async () => {
    const user = userEvent.setup();
    render(Fixture);

    await user.click(trigger("Products"));
    await fireEvent.pointerEnter(trigger("Company"));
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("Company")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /About/ })).toBeInTheDocument();
  });

  it("opens with ArrowDown and moves focus into the panel", async () => {
    const user = userEvent.setup();
    render(Fixture);

    trigger("Products").focus();
    await user.keyboard("{ArrowDown}");
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /Analytics/ })).toHaveFocus();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(Fixture);

    trigger("Products").focus();
    await user.keyboard("{ArrowDown}"); // open + focus first link
    await user.keyboard("{Escape}");
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("Products")).toHaveFocus();
  });

  it("closes on an outside press", async () => {
    const user = userEvent.setup();
    render(Fixture);

    await user.click(trigger("Products"));
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "true");
    await fireEvent.pointerDown(document.body);
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
  });

  it("has no accessibility violations", async () => {
    const user = userEvent.setup();
    const { container } = render(Fixture);
    expect(await axe(container)).toHaveNoViolations();

    await user.click(trigger("Products"));
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Svelte NavigationMenu (hover and press)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const enter = (el: HTMLElement) => fireEvent.pointerEnter(el, { pointerType: "mouse" });
  const leave = (el: HTMLElement) => fireEvent.pointerLeave(el, { pointerType: "mouse" });

  it("opens after the hover delay and closes when the pointer leaves", async () => {
    vi.useFakeTimers();
    render(Fixture);
    const products = trigger("Products");

    await enter(products);
    await vi.advanceTimersByTimeAsync(100);
    expect(products).toHaveAttribute("aria-expanded", "false");
    await vi.advanceTimersByTimeAsync(50);
    expect(products).toHaveAttribute("aria-expanded", "true");

    await leave(products);
    await vi.advanceTimersByTimeAsync(150);
    expect(products).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps a hovered panel open after a click, once the pointer leaves", async () => {
    vi.useFakeTimers();
    render(Fixture);
    const products = trigger("Products");

    await enter(products);
    await vi.advanceTimersByTimeAsync(150);
    await fireEvent.click(products);
    await leave(products);
    await vi.advanceTimersByTimeAsync(300);
    expect(products).toHaveAttribute("aria-expanded", "true");

    // A second click closes it.
    await fireEvent.click(products);
    expect(products).toHaveAttribute("aria-expanded", "false");
  });

  it("does not let a pending hover undo a click within the delay", async () => {
    vi.useFakeTimers();
    render(Fixture);
    const products = trigger("Products");

    await enter(products);
    await vi.advanceTimersByTimeAsync(50);
    await fireEvent.click(products);
    expect(products).toHaveAttribute("aria-expanded", "true");
    await vi.advanceTimersByTimeAsync(300);
    expect(products).toHaveAttribute("aria-expanded", "true");
  });

  it("does not reopen after a click closes it while the pointer stays", async () => {
    vi.useFakeTimers();
    render(Fixture);
    const products = trigger("Products");

    await enter(products);
    await vi.advanceTimersByTimeAsync(150);
    await fireEvent.click(products); // keeps it
    await fireEvent.click(products); // closes it
    await vi.advanceTimersByTimeAsync(1000);
    expect(products).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on Escape and an outside press, cancelling a pending hover", async () => {
    vi.useFakeTimers();
    render(Fixture);
    const products = trigger("Products");

    await fireEvent.click(products);
    await enter(trigger("Company"));
    expect(trigger("Company")).toHaveAttribute("aria-expanded", "true");
    await fireEvent.keyDown(trigger("Company"), { key: "Escape" });
    expect(trigger("Company")).toHaveAttribute("aria-expanded", "false");
    await vi.advanceTimersByTimeAsync(300);
    expect(trigger("Company")).toHaveAttribute("aria-expanded", "false");

    await fireEvent.click(products);
    const elsewhere = screen.getByRole("button", { name: "Elsewhere" });
    elsewhere.focus();
    await fireEvent.pointerDown(document.body);
    expect(products).toHaveAttribute("aria-expanded", "false");
    // An outside press moves no focus.
    expect(elsewhere).toHaveFocus();
  });
});

describe("Svelte NavigationMenu (links)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("closes the panel on a link click without focusing the trigger", async () => {
    vi.useFakeTimers();
    render(Fixture);
    const products = trigger("Products");
    await fireEvent.click(products);
    const link = screen.getByRole("link", { name: /Analytics/ });
    link.focus();
    // The app moves focus as part of the navigation, as a router does.
    const elsewhere = screen.getByRole("button", { name: "Elsewhere" });
    link.addEventListener("click", () => elsewhere.focus());

    await fireEvent.click(link);
    expect(products).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: /Analytics/ })).not.toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(0);
    expect(products).not.toHaveFocus();
    expect(elsewhere).toHaveFocus();
  });

  it("focuses the trigger only when focus would be lost", async () => {
    vi.useFakeTimers();
    render(Fixture);
    const products = trigger("Products");
    await fireEvent.click(products);
    const link = screen.getByRole("link", { name: /Analytics/ });
    link.focus();

    await fireEvent.click(link);
    expect(products).not.toHaveFocus();
    await vi.advanceTimersByTimeAsync(0);
    expect(products).toHaveFocus();
  });

  it("marks only the current link as the page, and its trigger visually", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const products = trigger("Products");
    expect(products).toHaveAttribute("data-current", "");
    expect(products).not.toHaveAttribute("aria-current");
    expect(trigger("Company")).not.toHaveAttribute("data-current");
    expect(screen.getByRole("link", { name: "Pricing" })).not.toHaveAttribute("aria-current");

    await user.click(products);
    expect(screen.getByRole("link", { name: /Automation/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: /Analytics/ })).not.toHaveAttribute("aria-current");
  });

  it("marks a current top-level link as the page", () => {
    render(NavigationMenu, {
      props: {
        label: "Main",
        items: [
          { value: "home", label: "Home", href: "#home" },
          { value: "pricing", label: "Pricing", href: "#pricing", current: true },
        ],
      },
    });
    const pricing = screen.getByRole("link", { name: "Pricing" });
    expect(pricing).toHaveAttribute("aria-current", "page");
    expect(pricing).toHaveAttribute("data-current", "");
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
  });
});
