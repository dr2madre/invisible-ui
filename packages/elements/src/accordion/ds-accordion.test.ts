import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsAccordion } from "./ds-accordion";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const markup = (attributes = "") => `
  <ds-accordion ${attributes}>
    <ds-accordion-item value="shipping" label="Shipping">Ships in <strong>3 to 5</strong> days.</ds-accordion-item>
    <ds-accordion-item value="returns" label="Returns">30-day returns.</ds-accordion-item>
    <ds-accordion-item value="support" label="Support">Email support.</ds-accordion-item>
  </ds-accordion>`;

const trigger = (name: string) => screen.getByRole("button", { name });
const host = () => document.querySelector("ds-accordion") as DsAccordion;

describe("<ds-accordion>", () => {
  it("renders header buttons linked to regions, all collapsed", () => {
    document.body.innerHTML = markup();
    const triggers = screen.getAllByRole("button");
    expect(triggers).toHaveLength(3);
    expect(triggers[0]).toHaveAttribute("aria-expanded", "false");
    const panelId = triggers[0]!.getAttribute("aria-controls")!;
    expect(document.getElementById(panelId)).toHaveClass("accordion__panel");
    expect(triggers[0]!.closest("h3")).toHaveClass("accordion__heading");
    // Collapsed panels are hidden, so they are out of the accessibility tree.
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("keeps the item children as the panel content", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = markup();
    await user.click(trigger("Shipping"));
    const panel = screen.getByRole("region", { name: "Shipping" });
    expect(panel).toHaveTextContent("Ships in 3 to 5 days.");
    expect(panel.querySelector("strong")).toHaveTextContent("3 to 5");
    expect(panel).toHaveAttribute("aria-labelledby", trigger("Shipping").id);
  });

  it("renders the initial value expanded", () => {
    document.body.innerHTML = markup(`value="shipping"`);
    expect(trigger("Shipping")).toHaveAttribute("aria-expanded", "true");
    expect(trigger("Shipping")).toHaveAttribute("data-state", "open");
  });

  it("single: opening one collapses the other and reports the change", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = markup(`value="shipping"`);
    const onChange = vi.fn();
    host().addEventListener("change", (event) => onChange((event as CustomEvent).detail.value));

    await user.click(trigger("Returns"));
    expect(onChange).toHaveBeenCalledWith(["returns"]);
    expect(trigger("Returns")).toHaveAttribute("aria-expanded", "true");
    expect(trigger("Shipping")).toHaveAttribute("aria-expanded", "false");
    expect(host().value).toEqual(["returns"]);
    expect(host()).toHaveAttribute("value", "returns");
  });

  it("single: the open item closes again unless collapsible is off", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = markup(`value="shipping"`);
    await user.click(trigger("Shipping"));
    expect(trigger("Shipping")).toHaveAttribute("aria-expanded", "false");

    document.body.innerHTML = markup(`value="shipping" collapsible="false"`);
    await user.click(trigger("Shipping"));
    expect(trigger("Shipping")).toHaveAttribute("aria-expanded", "true");
  });

  it("multiple: items expand independently", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = markup(`type="multiple" value="shipping"`);
    await user.click(trigger("Support"));
    expect(screen.getAllByRole("region")).toHaveLength(2);
    expect(host().value).toEqual(["shipping", "support"]);
  });

  it("moves focus between headers with the arrow keys, Home and End", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = markup();
    const [one, two, three] = screen.getAllByRole("button");
    one!.focus();
    await user.keyboard("{ArrowDown}");
    expect(two).toHaveFocus();
    await user.keyboard("{End}");
    expect(three).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(one).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(three).toHaveFocus();
    await user.keyboard("{Home}");
    expect(one).toHaveFocus();
  });

  it("skips a disabled item and disables the whole accordion", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = markup();
    document.querySelector("ds-accordion-item[value='returns']")!.setAttribute("disabled", "");
    expect(trigger("Returns")).toBeDisabled();
    trigger("Shipping").focus();
    await user.keyboard("{ArrowDown}");
    expect(trigger("Support")).toHaveFocus();

    host().setAttribute("disabled", "");
    expect(screen.getAllByRole("button").every((button) => button.hasAttribute("disabled"))).toBe(
      true,
    );
  });

  it("follows a value set from outside without reporting it", () => {
    document.body.innerHTML = markup();
    const onChange = vi.fn();
    host().addEventListener("change", onChange);
    host().value = ["support"];
    expect(trigger("Support")).toHaveAttribute("aria-expanded", "true");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("wires an item added later and updates a changed label", () => {
    document.body.innerHTML = markup();
    const extra = document.createElement("ds-accordion-item");
    extra.setAttribute("value", "billing");
    extra.setAttribute("label", "Billing");
    extra.textContent = "Invoices monthly.";
    host().appendChild(extra);
    expect(trigger("Billing")).toHaveAttribute("aria-expanded", "false");

    extra.setAttribute("label", "Invoices");
    expect(trigger("Invoices")).toBeInTheDocument();
  });

  it("renders the items shortcut with text content", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `<ds-accordion value="b"></ds-accordion>`;
    host().items = [
      { value: "a", label: "Alpha", content: "<b>First</b>" },
      { value: "b", content: "Second" },
    ];
    expect(trigger("b")).toHaveAttribute("aria-expanded", "true");
    await user.click(trigger("Alpha"));
    const panel = screen.getByRole("region", { name: "Alpha" });
    // Consumer strings are text, never markup.
    expect(panel.textContent).toBe("<b>First</b>");
    expect(panel.querySelector("b")).toBeNull();
    expect(host().items.map((item) => item.value)).toEqual(["a", "b"]);
  });

  it("uses items assigned before the element upgrades", () => {
    const element = document.createElement("ds-accordion") as DsAccordion;
    element.items = [{ value: "only", label: "Only", content: "Text" }];
    document.body.replaceChildren(element);
    expect(trigger("Only")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    document.body.innerHTML = markup(`value="shipping"`);
    expect(await axe(document.body, noAxeColorContrast)).toHaveNoViolations();
  });
});
