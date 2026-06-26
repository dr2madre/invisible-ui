import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Accordion from "./Accordion.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const items = [
  { value: "shipping", label: "Shipping", content: "Ships in 3–5 days." },
  { value: "returns", label: "Returns", content: "30-day returns." },
  { value: "support", label: "Support", content: "Email support." },
];

describe("Svelte Accordion (styled)", () => {
  it("renders triggers with the initial item expanded", () => {
    render(Accordion, { props: { items, value: ["shipping"] } });
    const shipping = screen.getByRole("button", { name: "Shipping" });
    expect(shipping).toHaveAttribute("aria-expanded", "true");
    expect(shipping).toHaveAttribute("data-state", "open");
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
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Accordion, { props: { items, value: ["shipping"] } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
