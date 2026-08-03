import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Accordion } from "./Accordion";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const items = [
  { value: "shipping", label: "Shipping", content: "Ships in 3-5 days." },
  { value: "returns", label: "Returns", content: "30-day returns." },
  { value: "support", label: "Support", content: "Email support." },
];

describe("Vue Accordion (styled)", () => {
  it("renders triggers linked to regions, all collapsed by default", () => {
    render(Accordion, { props: { items } });
    const triggers = screen.getAllByRole("button");
    expect(triggers).toHaveLength(3);
    expect(triggers[0]).toHaveAttribute("aria-expanded", "false");
    // Collapsed panels are hidden, so excluded from the accessibility tree.
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("renders the initial item expanded", () => {
    render(Accordion, { props: { items, value: ["shipping"] } });
    const shipping = screen.getByRole("button", { name: "Shipping" });
    expect(shipping).toHaveAttribute("aria-expanded", "true");
    expect(shipping).toHaveAttribute("data-state", "open");
  });

  it("expands an item on click and shows its labelled panel", async () => {
    const user = userEvent.setup();
    render(Accordion, { props: { items } });
    const shipping = screen.getByRole("button", { name: "Shipping" });

    await user.click(shipping);
    expect(shipping).toHaveAttribute("aria-expanded", "true");
    const panel = screen.getByRole("region");
    expect(panel).toHaveAttribute("aria-labelledby", shipping.id);
    expect(panel).toHaveTextContent("Ships in 3-5 days.");
  });

  it("expands on click and (single) collapses the previous item", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Accordion, { props: { items, value: ["shipping"], onValueChange } });

    await user.click(screen.getByRole("button", { name: "Returns" }));
    expect(onValueChange).toHaveBeenCalledWith(["returns"]);
    expect(screen.getByRole("button", { name: "Returns" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("button", { name: "Shipping" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("allows several open at once when type is multiple", async () => {
    const user = userEvent.setup();
    render(Accordion, { props: { items, type: "multiple", value: ["shipping"] } });

    await user.click(screen.getByRole("button", { name: "Support" }));
    expect(screen.getByRole("button", { name: "Shipping" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("button", { name: "Support" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getAllByRole("region")).toHaveLength(2);
  });

  it("moves focus between headers with arrow keys", async () => {
    const user = userEvent.setup();
    render(Accordion, { props: { items } });
    const [shipping, returns] = screen.getAllByRole("button");

    shipping.focus();
    await user.keyboard("{ArrowDown}");
    expect(returns).toHaveFocus();
    await user.keyboard("{Home}");
    expect(shipping).toHaveFocus();
  });

  it("supports v-model: emits update:modelValue with the expanded set", async () => {
    const user = userEvent.setup();
    const { emitted } = render(Accordion, { props: { items, modelValue: [] } });

    await user.click(screen.getByRole("button", { name: "Returns" }));
    expect(emitted("update:modelValue")).toEqual([[["returns"]]]);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Accordion, { props: { items, value: ["shipping"] } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
