import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Accordion, type AccordionEntry } from "./Accordion";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const items: AccordionEntry[] = [
  { value: "shipping", label: "Shipping", content: "Ships in 3–5 days." },
  { value: "returns", label: "Returns", content: "30-day returns." },
  { value: "support", label: "Support", content: "Email support." },
];

const trigger = (name: string) => screen.getByRole("button", { name });

describe("React Accordion (styled)", () => {
  it("renders header buttons linked to hidden regions", () => {
    render(<Accordion items={items} />);
    const shipping = trigger("Shipping");
    expect(shipping).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(document.getElementById(shipping.getAttribute("aria-controls")!)).toHaveAttribute(
      "aria-labelledby",
      shipping.id,
    );
  });

  it("renders the initial item expanded with its panel", () => {
    render(<Accordion items={items} value={["shipping"]} />);
    expect(trigger("Shipping")).toHaveAttribute("aria-expanded", "true");
    expect(trigger("Shipping")).toHaveAttribute("data-state", "open");
    expect(screen.getByRole("region", { name: "Shipping" })).toHaveTextContent(
      "Ships in 3–5 days.",
    );
  });

  it("single: opening one collapses the previous and reports once", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Accordion items={items} value={["shipping"]} onValueChange={onValueChange} />);
    await user.click(trigger("Returns"));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(["returns"]);
    expect(trigger("Returns")).toHaveAttribute("aria-expanded", "true");
    expect(trigger("Shipping")).toHaveAttribute("aria-expanded", "false");
  });

  it("single: the open item closes again unless collapsible is off", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Accordion items={items} value={["shipping"]} />);
    await user.click(trigger("Shipping"));
    expect(trigger("Shipping")).toHaveAttribute("aria-expanded", "false");
    unmount();

    render(<Accordion items={items} value={["shipping"]} collapsible={false} />);
    await user.click(trigger("Shipping"));
    expect(trigger("Shipping")).toHaveAttribute("aria-expanded", "true");
  });

  it("multiple: items expand independently", async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} type="multiple" value={["shipping"]} />);
    await user.click(trigger("Support"));
    expect(screen.getAllByRole("region")).toHaveLength(2);
  });

  it("moves focus between headers with the arrow keys, Home and End", async () => {
    const user = userEvent.setup();
    render(<Accordion items={items} />);
    trigger("Shipping").focus();
    await user.keyboard("{ArrowDown}");
    expect(trigger("Returns")).toHaveFocus();
    await user.keyboard("{End}");
    expect(trigger("Support")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(trigger("Returns")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(trigger("Shipping")).toHaveFocus();
  });

  it("skips a disabled item and disables the whole accordion", async () => {
    const user = userEvent.setup();
    const withDisabled = items.map((item) =>
      item.value === "returns" ? { ...item, disabled: true } : item,
    );
    const { rerender } = render(<Accordion items={withDisabled} />);
    trigger("Shipping").focus();
    await user.keyboard("{ArrowDown}");
    expect(trigger("Support")).toHaveFocus();

    rerender(<Accordion items={withDisabled} disabled />);
    for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
  });

  it("follows type and disabled changed after mount", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(
      <Accordion items={items} value={["shipping"]} disabled onValueChange={onValueChange} />,
    );
    rerender(
      <Accordion
        items={items}
        value={["shipping"]}
        type="multiple"
        onValueChange={onValueChange}
      />,
    );
    await user.click(trigger("Support"));
    expect(onValueChange).toHaveBeenCalledWith(["shipping", "support"]);
  });

  it("reflects a controlled value without reporting, and ignores a fresh equal array", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <Accordion items={items} value={["shipping"]} onValueChange={onValueChange} />,
    );
    rerender(<Accordion items={items} value={["support"]} onValueChange={onValueChange} />);
    expect(trigger("Support")).toHaveAttribute("aria-expanded", "true");
    expect(trigger("Shipping")).toHaveAttribute("aria-expanded", "false");
    rerender(<Accordion items={items} value={["support"]} onValueChange={onValueChange} />);
    expect(trigger("Support")).toHaveAttribute("aria-expanded", "true");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("navigates items given after mount", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Accordion items={items} />);
    rerender(<Accordion items={[...items, { value: "faq", label: "FAQ", content: "Answers." }]} />);
    trigger("Shipping").focus();
    await user.keyboard("{End}");
    expect(trigger("FAQ")).toHaveFocus();
  });

  it("sets the header level from headingLevel, falling back to 3", () => {
    const { rerender } = render(<Accordion items={items} />);
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
    rerender(
      <Accordion
        items={items.map((item, index) => (index === 0 ? { ...item, headingLevel: 4 } : item))}
        headingLevel={2}
      />,
    );
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(2);
    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent("Shipping");
  });

  it("renders rich panel content", () => {
    render(
      <Accordion
        items={[{ value: "rich", label: "Rich", content: <a href="#more">More</a> }]}
        value={["rich"]}
      />,
    );
    expect(screen.getByRole("link", { name: "More" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Accordion items={items} value={["shipping"]} />);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
