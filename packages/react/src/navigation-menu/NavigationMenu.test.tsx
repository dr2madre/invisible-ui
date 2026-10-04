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
