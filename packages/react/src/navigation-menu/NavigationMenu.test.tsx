import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import {
  NavigationMenu,
  type NavigationMenuItem,
  type NavigationMenuProps,
} from "./NavigationMenu";

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

function Fixture(props: Partial<NavigationMenuProps>) {
  return <NavigationMenu label="Main" items={items} {...props} />;
}

const trigger = (name: string) => screen.getByRole("button", { name });

afterEach(() => vi.useRealTimers());

describe("React NavigationMenu", () => {
  it("renders a nav landmark with triggers and plain links", () => {
    render(<Fixture />);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("link", { name: "Pricing" })).toHaveAttribute("href", "#pricing");
  });

  it("opens a panel on click and reveals its links", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Fixture onValueChange={onValueChange} />);
    await user.click(trigger("Products"));
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "true");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenLastCalledWith("products");
    expect(screen.getByRole("link", { name: /Analytics/ })).toBeInTheDocument();
  });

  it("opens on hover after the delay", () => {
    vi.useFakeTimers();
    render(<Fixture />);
    fireEvent.pointerEnter(trigger("Products"), { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(149));
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
    act(() => vi.advanceTimersByTime(1));
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps a panel closed by click closed when the hover delay runs out", () => {
    vi.useFakeTimers();
    render(<Fixture />);
    const products = trigger("Products");
    fireEvent.pointerEnter(products, { pointerType: "mouse" });
    fireEvent.click(products);
    expect(products).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(products);
    expect(products).toHaveAttribute("aria-expanded", "false");
    act(() => vi.advanceTimersByTime(150));
    expect(products).toHaveAttribute("aria-expanded", "false");
  });

  it("switches panels immediately on hover while open", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await user.click(trigger("Products"));
    fireEvent.pointerEnter(trigger("Company"), { pointerType: "mouse" });
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("Company")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /About/ })).toBeInTheDocument();
  });

  it("opens with ArrowDown and moves focus into the panel", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    trigger("Products").focus();
    await user.keyboard("{ArrowDown}");
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /Analytics/ })).toHaveFocus();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    trigger("Products").focus();
    await user.keyboard("{ArrowDown}{Escape}");
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("Products")).toHaveFocus();
  });

  it("closes on an outside press", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await user.click(trigger("Products"));
    fireEvent.pointerDown(document.body);
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
  });

  it("reflects a controlled value without reporting it", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Fixture value={null} onValueChange={onValueChange} />);
    rerender(<Fixture value="company" onValueChange={onValueChange} />);
    expect(trigger("Company")).toHaveAttribute("aria-expanded", "true");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("closes a hover-opened panel when the pointer leaves", () => {
    vi.useFakeTimers();
    render(<Fixture />);
    const products = trigger("Products");
    fireEvent.pointerEnter(products, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(150));
    expect(products).toHaveAttribute("aria-expanded", "true");
    fireEvent.pointerLeave(products, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(150));
    expect(products).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps a hover-opened panel open after a click, until a second click", () => {
    vi.useFakeTimers();
    render(<Fixture />);
    const products = trigger("Products");
    fireEvent.pointerEnter(products, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(150));
    fireEvent.click(products);
    fireEvent.pointerLeave(products, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(500));
    expect(products).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(products);
    expect(products).toHaveAttribute("aria-expanded", "false");
  });

  it("does not let a pending hover undo a click made within the delay", () => {
    vi.useFakeTimers();
    const onValueChange = vi.fn();
    render(<Fixture onValueChange={onValueChange} />);
    const products = trigger("Products");
    fireEvent.pointerEnter(products, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(50));
    fireEvent.click(products);
    act(() => vi.advanceTimersByTime(500));
    expect(products).toHaveAttribute("aria-expanded", "true");
    expect(onValueChange.mock.calls).toEqual([["products"]]);
  });

  it("does not reopen on hover after a click closed it while the pointer stays", () => {
    vi.useFakeTimers();
    render(<Fixture />);
    const products = trigger("Products");
    fireEvent.pointerEnter(products, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(150));
    fireEvent.click(products);
    fireEvent.click(products);
    act(() => vi.advanceTimersByTime(1000));
    expect(products).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on Escape with a hover open pending, and stays closed", () => {
    vi.useFakeTimers();
    render(<Fixture />);
    const products = trigger("Products");
    products.focus();
    fireEvent.pointerEnter(products, { pointerType: "mouse" });
    fireEvent.keyDown(products, { key: "Escape" });
    act(() => vi.advanceTimersByTime(1000));
    expect(products).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on an outside press without moving focus", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Fixture />
        <input aria-label="Search" />
      </>,
    );
    await user.click(trigger("Products"));
    await user.click(screen.getByRole("textbox", { name: "Search" }));
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("textbox", { name: "Search" })).toHaveFocus();
  });

  it("closes the panel on a link click and leaves focus to the navigation", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <>
        <Fixture onValueChange={onValueChange} />
        <h1 tabIndex={-1}>Analytics</h1>
      </>,
    );
    // The page's router moves focus to the new content.
    const moveFocus = (event: MouseEvent) => {
      if ((event.target as Element).closest("a")) screen.getByRole("heading").focus();
    };
    document.addEventListener("click", moveFocus);
    try {
      await user.click(trigger("Products"));
      await user.click(screen.getByRole("link", { name: /Analytics/ }));
      expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
      expect(onValueChange).toHaveBeenLastCalledWith(null);
      await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
      expect(screen.getByRole("heading")).toHaveFocus();
      expect(trigger("Products")).not.toHaveFocus();
    } finally {
      document.removeEventListener("click", moveFocus);
    }
  });

  it("gives focus to the trigger when a link click left it on the body", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await user.click(trigger("Products"));
    await user.click(screen.getByRole("link", { name: /Analytics/ }));
    expect(trigger("Products")).toHaveAttribute("aria-expanded", "false");
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    expect(trigger("Products")).toHaveFocus();
  });

  it("marks only the current link as the page, and its trigger visually", async () => {
    const user = userEvent.setup();
    const marked: NavigationMenuItem[] = [
      {
        ...items[0]!,
        links: [{ label: "Analytics", href: "#analytics", current: true }, items[0]!.links![1]!],
      },
      items[1]!,
      items[2]!,
    ];
    render(<Fixture items={marked} />);
    expect(trigger("Products")).toHaveAttribute("data-current", "");
    expect(trigger("Products")).not.toHaveAttribute("aria-current");
    expect(trigger("Company")).not.toHaveAttribute("data-current");
    expect(screen.getByRole("link", { name: "Pricing" })).not.toHaveAttribute("aria-current");
    await user.click(trigger("Products"));
    expect(screen.getByRole("link", { name: /Analytics/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Automation/ })).not.toHaveAttribute("aria-current");
  });

  it("marks a current top-level link as the page", () => {
    render(<Fixture items={[items[0]!, { ...items[2]!, current: true }]} />);
    const pricing = screen.getByRole("link", { name: "Pricing" });
    expect(pricing).toHaveAttribute("aria-current", "page");
    expect(pricing).toHaveAttribute("data-current", "");
  });

  it("keeps a controlled value open when the pointer leaves", () => {
    vi.useFakeTimers();
    const { rerender } = render(<Fixture value={null} />);
    rerender(<Fixture value="company" />);
    fireEvent.pointerLeave(trigger("Company"), { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(500));
    expect(trigger("Company")).toHaveAttribute("aria-expanded", "true");
  });

  it("has no accessibility violations", async () => {
    const user = userEvent.setup();
    const { container } = render(<Fixture />);
    expect(await axe(container)).toHaveNoViolations();
    await user.click(trigger("Products"));
    expect(
      await axe(document.body, { rules: { region: { enabled: false } } }),
    ).toHaveNoViolations();
  });
});
