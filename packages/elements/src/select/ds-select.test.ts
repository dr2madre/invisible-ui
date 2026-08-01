import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsSelect } from "./ds-select";

const mount = (html: string) => {
  document.body.innerHTML = html;
  return document.querySelector("ds-select") as DsSelect;
};
const select = () => screen.getByRole("combobox") as HTMLSelectElement;

const MARKUP = `
  <ds-select label="Fruit" name="fruit">
    <option value="apple">Apple</option>
    <option value="pear">Pear</option>
    <option value="fig" disabled>Fig</option>
  </ds-select>`;

describe("<ds-select>", () => {
  it("is a native select whose options come from light-DOM children", () => {
    mount(MARKUP);
    const el = screen.getByRole("combobox", { name: "Fruit" });
    expect(el.tagName).toBe("SELECT");
    expect(screen.getByRole("option", { name: "Apple" })).toBeEnabled();
    expect(screen.getByRole("option", { name: "Fig" })).toBeDisabled();
  });

  it("shows the placeholder while nothing is selected", () => {
    mount(MARKUP);
    expect(select()).toHaveValue("");
    expect(select()).toHaveClass("select__native--placeholder");
  });

  it("emits change with the chosen value and reflects it", async () => {
    const user = userEvent.setup();
    const host = mount(MARKUP);
    const onChange = vi.fn();
    host.addEventListener("change", (e) => onChange((e as CustomEvent).detail));

    await user.selectOptions(select(), "pear");
    expect(onChange).toHaveBeenCalledWith({ value: "pear" });
    expect(host.value).toBe("pear");
    expect(select()).not.toHaveClass("select__native--placeholder");
  });

  it("participates in a native form", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `<form>${MARKUP}</form>`;
    await user.selectOptions(select(), "apple");
    expect(new FormData(document.querySelector("form")!).get("fruit")).toBe("apple");
  });

  it("announces the invalid state and links the message", () => {
    const host = mount(MARKUP);
    host.setAttribute("error", "Pick a fruit");
    expect(select()).toHaveAttribute("aria-invalid", "true");
    expect(select()).toHaveAccessibleDescription("Pick a fruit");

    host.removeAttribute("error");
    expect(select()).not.toHaveAttribute("aria-invalid");
  });

  it("accepts items through the property as well", () => {
    const host = mount(`<ds-select label="Fruit"></ds-select>`);
    host.items = [{ value: "kiwi", label: "Kiwi" }];
    expect(screen.getByRole("option", { name: "Kiwi" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    mount(MARKUP);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
