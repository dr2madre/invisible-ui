import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsCheckboxGroup } from "./ds-checkbox-group";

const mount = (html: string) => {
  document.body.innerHTML = html;
  return document.querySelector("ds-checkbox-group") as DsCheckboxGroup;
};

const group = `<ds-checkbox-group label="Toppings" name="toppings">
  <option value="olive">Olive</option>
  <option value="caper">Caper</option>
  <option value="anchovy" disabled>Anchovy</option>
</ds-checkbox-group>`;

describe("<ds-checkbox-group>", () => {
  it("renders native checkboxes under a legend", () => {
    mount(group);
    expect(screen.getByRole("group", { name: "Toppings" })).toBeInTheDocument();
    const boxes = screen.getAllByRole("checkbox");
    expect(boxes).toHaveLength(3);
    expect(boxes[0]).toHaveAttribute("name", "toppings");
    expect(screen.getByRole("checkbox", { name: "Anchovy" })).toBeDisabled();
  });

  it("collects several values and emits them as an array", async () => {
    const user = userEvent.setup();
    const host = mount(group);
    const seen: string[][] = [];
    host.addEventListener("change", (event) => seen.push((event as CustomEvent).detail.value));

    await user.click(screen.getByRole("checkbox", { name: "Olive" }));
    await user.click(screen.getByRole("checkbox", { name: "Caper" }));

    expect(host.value).toEqual(["olive", "caper"]);
    expect(seen.at(-1)).toEqual(["olive", "caper"]);
  });

  it("drops a value when its box is unchecked", async () => {
    const user = userEvent.setup();
    const host = mount(group.replace('name="toppings"', 'name="toppings" value="olive,caper"'));

    await user.click(screen.getByRole("checkbox", { name: "Olive" }));

    expect(host.value).toEqual(["caper"]);
  });

  it("starts from the comma-separated value attribute", () => {
    mount(group.replace('name="toppings"', 'name="toppings" value="caper"'));
    expect(screen.getByRole("checkbox", { name: "Caper" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Olive" })).not.toBeChecked();
  });

  it("has no accessibility violations", async () => {
    mount(group);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
