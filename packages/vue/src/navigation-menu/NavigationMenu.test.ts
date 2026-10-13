import { fireEvent, render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { nextTick } from "vue";
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

  it("keeps a panel closed by click closed when the hover delay runs out", async () => {
    vi.useFakeTimers();
    try {
      renderNav();
      const products = trigger("Products");
      // A pointer click hovers the trigger first, which starts the open delay.
      await fireEvent.pointerEnter(products, { pointerType: "mouse" });
      await fireEvent.click(products);
      expect(products).toHaveAttribute("aria-expanded", "true");
      await fireEvent.click(products);
      expect(products).toHaveAttribute("aria-expanded", "false");
      await vi.advanceTimersByTimeAsync(150);
      await nextTick();
      expect(products).toHaveAttribute("aria-expanded", "false");
    } finally {
      vi.useRealTimers();
    }
  });

  describe("hover", () => {
    const enter = (el: Element) => fireEvent.pointerEnter(el, { pointerType: "mouse" });
    const leave = (el: Element) => fireEvent.pointerLeave(el, { pointerType: "mouse" });
    const wait = async (ms: number) => {
      await vi.advanceTimersByTimeAsync(ms);
      await nextTick();
    };

    it("opens after the delay and closes when the pointer leaves", async () => {
      vi.useFakeTimers();
      try {
        renderNav();
        await enter(trigger("Products"));
        await wait(100);
        expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
        await wait(60);
        expect(trigger("Products")).toHaveAttribute("aria-expanded", "true");
        await leave(trigger("Products"));
        await wait(160);
        expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
      } finally {
        vi.useRealTimers();
      }
    });

    it("keeps a hovered panel open after a click, until a second click", async () => {
      vi.useFakeTimers();
      try {
        renderNav();
        await enter(trigger("Products"));
        await wait(160);
        await fireEvent.click(trigger("Products"));
        expect(trigger("Products")).toHaveAttribute("aria-expanded", "true");
        await leave(trigger("Products"));
        await wait(300);
        expect(trigger("Products")).toHaveAttribute("aria-expanded", "true");
        await fireEvent.click(trigger("Products"));
        expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
      } finally {
        vi.useRealTimers();
      }
    });

    it("does not let a pending hover undo a click within the delay", async () => {
      vi.useFakeTimers();
      try {
        renderNav();
        await enter(trigger("Products"));
        await wait(50);
        await fireEvent.click(trigger("Products"));
        await leave(trigger("Products"));
        await wait(300);
        expect(trigger("Products")).toHaveAttribute("aria-expanded", "true");
      } finally {
        vi.useRealTimers();
      }
    });

    it("does not reopen after a click closes it while the pointer stays", async () => {
      vi.useFakeTimers();
      try {
        renderNav();
        await enter(trigger("Products"));
        await wait(160);
        await fireEvent.click(trigger("Products"));
        await fireEvent.click(trigger("Products"));
        await wait(500);
        expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
      } finally {
        vi.useRealTimers();
      }
    });

    it("cancels a pending hover open on Escape and on an outside press", async () => {
      vi.useFakeTimers();
      try {
        renderNav();
        await fireEvent.click(trigger("Company"));
        await enter(trigger("Products"));
        expect(trigger("Products")).toHaveAttribute("aria-expanded", "true");
        await fireEvent.pointerDown(document.body);
        expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");

        await enter(trigger("Products"));
        await fireEvent.keyDown(trigger("Products"), { key: "Escape" });
        await wait(500);
        expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
      } finally {
        vi.useRealTimers();
      }
    });
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

  it("closes on an outside press without moving focus", async () => {
    const user = userEvent.setup();
    renderNav();

    await user.click(trigger("Products"));
    const pricing = screen.getByRole("link", { name: "Pricing" });
    pricing.focus();
    await fireEvent.pointerDown(document.body);
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
    expect(pricing).toHaveFocus();
  });

  it("marks only the current link as the page, and its trigger for styling", async () => {
    const user = userEvent.setup();
    const marked: NavigationMenuItem[] = [
      {
        value: "products",
        label: "Products",
        links: [
          { label: "Analytics", href: "#analytics", current: true },
          { label: "Automation", href: "#automation" },
        ],
      },
      { value: "pricing", label: "Pricing", href: "#pricing" },
      { value: "blog", label: "Blog", href: "#blog", current: true },
    ];
    renderNav({ items: marked });

    expect(trigger("Products")).toHaveAttribute("data-current");
    expect(trigger("Products")).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Blog" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Pricing" })).not.toHaveAttribute("aria-current");

    await user.click(trigger("Products"));
    expect(screen.getByRole("link", { name: "Analytics" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Automation" })).not.toHaveAttribute("aria-current");
  });

  it("closes the panel on a link click and leaves focus where the app puts it", async () => {
    vi.useFakeTimers();
    try {
      renderNav();
      const pricing = screen.getByRole("link", { name: "Pricing" });
      await fireEvent.click(trigger("Products"));
      const link = screen.getByRole("link", { name: /Analytics/ });
      link.focus();
      link.addEventListener("click", () => pricing.focus());
      await fireEvent.click(link);
      await vi.advanceTimersByTimeAsync(0);
      expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
      expect(pricing).toHaveFocus();
    } finally {
      vi.useRealTimers();
    }
  });

  it("focuses the trigger when a link click leaves focus on the page", async () => {
    vi.useFakeTimers();
    try {
      renderNav();
      await fireEvent.click(trigger("Products"));
      const link = screen.getByRole("link", { name: /Analytics/ });
      link.focus();
      await fireEvent.click(link);
      await vi.advanceTimersByTimeAsync(0);
      expect(screen.queryByRole("link", { name: /Analytics/ })).toBeNull();
      expect(trigger("Products")).toHaveFocus();
    } finally {
      vi.useRealTimers();
    }
  });

  it("has no accessibility violations, closed and open", async () => {
    const user = userEvent.setup();
    renderNav();
    expect(await axe(document.body, noAxeRegion)).toHaveNoViolations();

    await user.click(trigger("Products"));
    expect(await axe(document.body, noAxeRegion)).toHaveNoViolations();
  });
});
