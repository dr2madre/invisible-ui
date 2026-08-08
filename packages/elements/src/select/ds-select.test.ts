import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import { DsSelect as DsSelectCtor } from "./ds-select";
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

  it("the label, name and required attributes drive the control after the first render", () => {
    const host = mount(MARKUP);
    expect(select().name).toBe("fruit");

    host.setAttribute("label", "Produce");
    host.setAttribute("name", "produce");
    host.setAttribute("required", "");

    expect(screen.getByRole("combobox", { name: "Produce" })).toBe(select());
    expect(select().name).toBe("produce");
    expect(select().required).toBe(true);
  });

  it("the presentation attributes drive the root after the first render", () => {
    const host = mount(MARKUP);
    const root = document.querySelector(".select") as HTMLElement;
    expect(root.dataset.width).toBe("wrap");

    host.setAttribute("width", "fill");
    host.setAttribute("hide-label", "");

    expect(root.dataset.width).toBe("fill");
    expect(document.querySelector(".select__label")).toHaveClass("select__label--hidden");
  });

  it("the placeholder attribute drives the empty option after the first render", () => {
    const host = mount(MARKUP);
    host.setAttribute("placeholder", "Pick one…");
    expect(select().querySelector("option[value='']")).toHaveTextContent("Pick one…");
  });

  it("has no accessibility violations", async () => {
    mount(MARKUP);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

// A framework that stamps properties before the definition loads, or before the
// element connects, would otherwise see its list replaced by the empty set of
// light-DOM children.
describe("items assigned before connection", () => {
  it("survive the first render", () => {
    document.body.innerHTML = "";
    const host = document.createElement("ds-select") as DsSelect;
    host.setAttribute("label", "Fruit");
    host.items = [{ value: "apple", label: "Apple" }];
    document.body.appendChild(host);

    expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument();
  });

  it("survive an assignment made before the definition loaded", () => {
    document.body.innerHTML = `<ds-select-later label="Fruit"></ds-select-later>`;
    const host = document.querySelector("ds-select-later") as DsSelect;
    host.items = [{ value: "pear", label: "Pear" }];

    customElements.define("ds-select-later", class extends DsSelectCtor {});

    expect(screen.getByRole("option", { name: "Pear" })).toBeInTheDocument();
  });

  it("keep an assigned empty list rather than the declarative children", () => {
    document.body.innerHTML = "";
    const host = document.createElement("ds-select") as DsSelect;
    host.setAttribute("label", "Fruit");
    host.innerHTML = `<option value="apple">Apple</option>`;
    host.items = [];
    document.body.appendChild(host);

    expect(host.items).toEqual([]);
    expect(screen.queryByRole("option", { name: "Apple" })).toBeNull();
  });
});

// Rebuilt options carry no selection, so the current value has to be applied
// to them again, or dropped when the new list stops offering it.
describe("rebuilding the options", () => {
  it("retains a value the new list still offers", () => {
    const host = mount(`<ds-select label="Fruit" value="pear"></ds-select>`);
    host.items = [
      { value: "apple", label: "Apple" },
      { value: "pear", label: "Pear" },
    ];

    expect(host.value).toBe("pear");
    expect(select().value).toBe("pear");
  });

  it("clears a value the new list no longer offers", () => {
    const host = mount(`<ds-select label="Fruit" value="pear"></ds-select>`);
    host.items = [{ value: "apple", label: "Apple" }];

    expect(host.value).toBeNull();
    expect(host.hasAttribute("value")).toBe(false);
    expect(select().value).toBe("");
  });
});
