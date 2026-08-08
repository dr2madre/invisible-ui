import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import { DsRadioGroup as DsRadioGroupCtor } from "./ds-radio-group";
import type { DsRadioGroup } from "./ds-radio-group";

const mount = (html: string) => {
  document.body.innerHTML = html;
  return document.querySelector("ds-radio-group") as DsRadioGroup;
};

const group = `<ds-radio-group label="Plan" name="plan">
  <option value="free">Free</option>
  <option value="pro">Pro</option>
  <option value="team" disabled>Team</option>
</ds-radio-group>`;

describe("<ds-radio-group>", () => {
  it("renders native radios under a named group", () => {
    mount(group);
    expect(screen.getByRole("radiogroup", { name: "Plan" })).toBeInTheDocument();
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
    expect(radios[0]).toHaveAttribute("name", "plan");
    expect(screen.getByRole("radio", { name: "Team" })).toBeDisabled();
  });

  it("reflects the selected value and emits change on press", async () => {
    const user = userEvent.setup();
    const host = mount(group);
    const seen: string[] = [];
    host.addEventListener("change", (event) => seen.push((event as CustomEvent).detail.value));

    await user.click(screen.getByRole("radio", { name: "Pro" }));

    expect(host.value).toBe("pro");
    expect(seen).toEqual(["pro"]);
    expect(screen.getByRole("radio", { name: "Pro" })).toBeChecked();
  });

  it("starts from the value attribute", () => {
    mount(group.replace('name="plan"', 'name="plan" value="pro"'));
    expect(screen.getByRole("radio", { name: "Pro" })).toBeChecked();
  });

  it("disables every item when the group is disabled", () => {
    mount(group.replace('name="plan"', 'name="plan" disabled'));
    for (const radio of screen.getAllByRole("radio")) expect(radio).toBeDisabled();
  });

  it("the name attribute drives the radios after the first render", () => {
    const host = mount(group);
    const radio = screen.getByRole("radio", { name: "Free" });
    expect(radio).toHaveAttribute("name", "plan");

    host.setAttribute("name", "tier");
    expect(radio).toHaveAttribute("name", "tier");
  });

  it("accepts items through the property as well", () => {
    const host = mount(group);
    host.items = [
      { value: "solo", label: "Solo" },
      { value: "duo", label: "Duo" },
    ];

    expect(screen.getByRole("radio", { name: "Solo" })).toBeInTheDocument();
    expect(screen.queryByRole("radio", { name: "Free" })).toBeNull();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("keeps the group wiring after the items are replaced", async () => {
    const user = userEvent.setup();
    const host = mount(group);
    host.items = [{ value: "duo", label: "Duo" }];

    await user.click(screen.getByRole("radio", { name: "Duo" }));
    expect(host.value).toBe("duo");
    expect(screen.getByRole("radio", { name: "Duo" })).toHaveAttribute("name", "plan");
  });

  it("has no accessibility violations", async () => {
    mount(group);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

// A framework that stamps properties before the definition loads, or before the
// element connects, would otherwise see its list replaced by the empty set of
// light-DOM children.
describe("items assigned before connection", () => {
  it("survive the first render", () => {
    document.body.innerHTML = "";
    const host = document.createElement("ds-radio-group") as DsRadioGroup;
    host.setAttribute("label", "Plan");
    host.items = [{ value: "solo", label: "Solo" }];
    document.body.appendChild(host);

    expect(screen.getByRole("radio", { name: "Solo" })).toBeInTheDocument();
  });

  it("survive an assignment made before the definition loaded", () => {
    document.body.innerHTML = `<ds-radio-group-later label="Plan"></ds-radio-group-later>`;
    const host = document.querySelector("ds-radio-group-later") as DsRadioGroup;
    host.items = [{ value: "duo", label: "Duo" }];

    customElements.define("ds-radio-group-later", class extends DsRadioGroupCtor {});

    expect(screen.getByRole("radio", { name: "Duo" })).toBeInTheDocument();
  });
});
