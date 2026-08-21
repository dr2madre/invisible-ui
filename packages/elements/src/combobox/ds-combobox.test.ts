import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import { DsCombobox as DsComboboxCtor } from "./ds-combobox";
import type { DsCombobox } from "./ds-combobox";

const MARKUP = `
  <ds-combobox label="Fruit" name="fruit">
    <option value="apple">Apple</option>
    <option value="banana">Banana</option>
    <option value="cherry" disabled>Cherry</option>
  </ds-combobox>`;

const mount = (html: string = MARKUP) => {
  document.body.innerHTML = html;
  return document.querySelector("ds-combobox") as DsCombobox;
};
const input = () => screen.getByRole("combobox") as HTMLInputElement;
const listbox = () => screen.getByRole("listbox");

describe("<ds-combobox>", () => {
  it("renders an editable combobox input, closed", () => {
    mount();
    expect(input()).toHaveAttribute("aria-expanded", "false");
    expect(input()).toHaveAttribute("aria-autocomplete", "list");
    expect(input()).toHaveAccessibleName("Fruit");
  });

  it("opens and filters as you type, emitting input-change", async () => {
    const user = userEvent.setup();
    const host = mount();
    const onInput = vi.fn();
    host.addEventListener("input-change", (e) => onInput((e as CustomEvent).detail));

    await user.type(input(), "ba");
    expect(input()).toHaveAttribute("aria-expanded", "true");
    const options = within(listbox()).getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Banana");
    expect(onInput).toHaveBeenLastCalledWith({ value: "ba" });
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    mount();
    await user.type(input(), "zzz");
    expect(within(listbox()).getByText("No results")).toBeInTheDocument();
  });

  it("the empty-text attribute drives the empty state after the first render", async () => {
    const user = userEvent.setup();
    const host = mount();
    await user.type(input(), "zzz");

    host.setAttribute("empty-text", "Nothing here");
    expect(within(listbox()).getByText("Nothing here")).toBeInTheDocument();
  });

  it("selects an option on press, filling the input and closing", async () => {
    const user = userEvent.setup();
    const host = mount();
    const onChange = vi.fn();
    host.addEventListener("change", (e) => onChange((e as CustomEvent).detail));

    await user.type(input(), "ban");
    await user.click(within(listbox()).getByRole("option", { name: "Banana" }));
    expect(onChange).toHaveBeenCalledWith({ value: "banana" });
    expect(input()).toHaveValue("Banana");
    expect(input()).toHaveAttribute("aria-expanded", "false");
    expect(host.value).toBe("banana");
  });

  it("navigates with the keyboard and selects with Enter", async () => {
    const user = userEvent.setup();
    const host = mount();
    const onChange = vi.fn();
    host.addEventListener("change", (e) => onChange((e as CustomEvent).detail));

    input().focus();
    await user.keyboard("{ArrowDown}"); // opens, active = Apple
    await user.keyboard("{ArrowDown}"); // -> Banana
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith({ value: "banana" });
    expect(input()).toHaveValue("Banana");
  });

  it("tracks the highlight via aria-activedescendant, focus stays on the input", async () => {
    const user = userEvent.setup();
    mount();
    input().focus();
    await user.keyboard("{ArrowDown}");
    const active = input().getAttribute("aria-activedescendant");
    expect(active).toBeTruthy();
    expect(document.activeElement).toBe(input());
    expect(document.getElementById(active!)).toHaveAttribute("data-active", "");
  });

  it("closes on Escape and puts the text back", async () => {
    const user = userEvent.setup();
    mount(MARKUP.replace("<ds-combobox", '<ds-combobox value="banana"'));
    await user.clear(input());
    await user.type(input(), "a");
    expect(input()).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    expect(input()).toHaveAttribute("aria-expanded", "false");
    expect(input().value).toBe("Banana");
  });

  it("puts the text back to the selection when focus leaves", async () => {
    const user = userEvent.setup();
    mount(`${MARKUP.replace("<ds-combobox", '<ds-combobox value="banana"')}
      <button type="button">after</button>`);
    await user.clear(input());
    await user.type(input(), "ch");
    expect(input().value).toBe("ch");

    await user.tab();
    // "ch" was a filter, never a value: leaving must not imply it was chosen.
    expect(input().value).toBe("Banana");
  });

  it("empties a leftover filter when nothing was ever chosen", async () => {
    const user = userEvent.setup();
    mount(`${MARKUP}<button type="button">after</button>`);
    await user.type(input(), "ba");
    await user.tab();
    expect(input().value).toBe("");
  });

  it("closes when a pointer goes down outside", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `${MARKUP}<button type="button">outside</button>`;
    await user.type(input(), "a");
    expect(input()).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("button", { name: "outside" }));
    expect(input()).toHaveAttribute("aria-expanded", "false");
  });

  it("the chevron opens the full list even with a value selected", async () => {
    const user = userEvent.setup();
    mount(`<ds-combobox label="Fruit" value="apple">
      <option value="apple">Apple</option>
      <option value="banana">Banana</option>
    </ds-combobox>`);
    expect(input()).toHaveValue("Apple");

    await user.click(screen.getByRole("button", { name: "Show options" }));
    expect(within(listbox()).getAllByRole("option")).toHaveLength(2);
  });

  it("submits the selected value through the hidden input", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `<form>${MARKUP}</form>`;
    await user.type(input(), "ban");
    await user.click(within(listbox()).getByRole("option", { name: "Banana" }));
    expect(new FormData(document.querySelector("form")!).get("fruit")).toBe("banana");
  });

  it("select-only mode: read-only trigger, never filters", async () => {
    const user = userEvent.setup();
    mount(`<ds-combobox label="Priority" searchable="false" value="high">
      <option value="high" icon="M12 19V5m-7 7 7-7 7 7">High</option>
      <option value="low" icon="M12 5v14m7-7-7 7-7-7">Low</option>
    </ds-combobox>`);
    const trigger = screen.getByRole("combobox", { name: "Priority" });
    expect(trigger).toHaveAttribute("readonly");
    expect(trigger).toHaveValue("High");

    await user.click(trigger);
    expect(screen.getAllByRole("option")).toHaveLength(2);
    expect(document.querySelectorAll(".combobox__option-icon").length).toBeGreaterThan(0);
  });

  it("the presentation attributes drive the control after the first render", () => {
    const host = mount();
    const root = document.querySelector(".combobox") as HTMLElement;
    expect(root.dataset.width).toBe("fixed");

    host.setAttribute("width", "fill");
    host.setAttribute("label", "Produce");
    host.setAttribute("placeholder", "Type to filter…");
    host.setAttribute("clear-label", "Reset");

    expect(root.dataset.width).toBe("fill");
    expect(input()).toHaveAccessibleName("Produce");
    expect(input().placeholder).toBe("Type to filter…");
    expect(screen.getByRole("button", { name: "Reset" })).toBeInTheDocument();
  });

  it("the searchable attribute switches the select-only mode after the first render", () => {
    const host = mount();
    expect(input().readOnly).toBe(false);
    expect(document.querySelector(".combobox__search")!.innerHTML).not.toBe("");

    host.setAttribute("searchable", "false");
    expect(input().readOnly).toBe(true);
    expect(input()).toHaveClass("combobox__input--select-only");
    expect(document.querySelector(".combobox__search")!.innerHTML).toBe("");

    host.setAttribute("searchable", "true");
    expect(input().readOnly).toBe(false);
    expect(input()).not.toHaveClass("combobox__input--select-only");
  });

  it("the name attribute creates and drops the hidden form input", () => {
    const host = mount();
    expect(document.querySelector("input[type=hidden]")).toHaveAttribute("name", "fruit");

    host.setAttribute("name", "produce");
    expect(document.querySelector("input[type=hidden]")).toHaveAttribute("name", "produce");

    host.removeAttribute("name");
    expect(document.querySelector("input[type=hidden]")).toBeNull();
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    mount();
    await user.type(input(), "a");
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

// A framework that stamps properties before the definition loads, or before the
// element connects, would otherwise see its list replaced by the empty set of
// light-DOM children.
describe("items assigned before connection", () => {
  it("survive the first render", () => {
    document.body.innerHTML = "";
    const host = document.createElement("ds-combobox") as DsCombobox;
    host.setAttribute("label", "Fruit");
    host.items = [{ value: "apple", label: "Apple" }];
    document.body.appendChild(host);

    expect(screen.getByRole("option", { name: "Apple" })).toBeInTheDocument();
  });

  it("survive an assignment made before the definition loaded", () => {
    document.body.innerHTML = `<ds-combobox-later label="Fruit"></ds-combobox-later>`;
    const host = document.querySelector("ds-combobox-later") as DsCombobox;
    host.items = [{ value: "pear", label: "Pear" }];

    customElements.define("ds-combobox-later", class extends DsComboboxCtor {});

    expect(screen.getByRole("option", { name: "Pear" })).toBeInTheDocument();
  });

  it("keep an assigned empty list rather than the declarative children", () => {
    document.body.innerHTML = "";
    const host = document.createElement("ds-combobox") as DsCombobox;
    host.setAttribute("label", "Fruit");
    host.innerHTML = `<option value="apple">Apple</option>`;
    host.items = [];
    document.body.appendChild(host);

    expect(host.items).toEqual([]);
    expect(screen.queryByRole("option", { name: "Apple" })).toBeNull();
    expect(document.querySelector(".combobox__empty")).toBeInTheDocument();
  });
});

// The option icon is consumer data. It used to be interpolated into an HTML
// string, so a value that closed the attribute could add elements to the page.
describe("option icons", () => {
  it("render the path a valid icon describes", () => {
    document.body.innerHTML = "";
    const host = document.createElement("ds-combobox") as DsCombobox;
    host.setAttribute("label", "Fruit");
    host.items = [{ value: "apple", label: "Apple", icon: "M4 4 L20 20" }];
    document.body.appendChild(host);

    const path = document.querySelector(".combobox__option-icon path")!;
    expect(path.getAttribute("d")).toBe("M4 4 L20 20");
  });

  it("keep hostile input inside the path data", () => {
    document.body.innerHTML = "";
    const host = document.createElement("ds-combobox") as DsCombobox;
    host.setAttribute("label", "Fruit");
    host.items = [
      {
        value: "apple",
        label: "Apple",
        icon: `" /><img src=x onerror="globalThis.pwned=1"><path d="`,
      },
    ];
    document.body.appendChild(host);

    expect(document.querySelector(".combobox__option-icon img")).toBeNull();
    expect((globalThis as Record<string, unknown>).pwned).toBeUndefined();
    const path = document.querySelector(".combobox__option-icon path")!;
    expect(path.getAttribute("d")).toContain("onerror");
  });
});

// Clearing used to update the state alone: the attribute kept the old value, so
// reconnecting the element brought the selection back.
describe("clearing the selection", () => {
  const withValue = `<ds-combobox label="Fruit" name="fruit" value="apple">
    <option value="apple">Apple</option>
    <option value="pear">Pear</option>
  </ds-combobox>`;

  it("updates the property, the attribute, the input and the form value", async () => {
    const user = userEvent.setup();
    // The component submits through a hidden input, so the form it belongs to
    // is what proves the cleared value reaches the submission.
    const host = mount(`<form>${withValue}</form>`);
    const form = document.querySelector("form")!;

    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(host.value).toBeNull();
    expect(host.hasAttribute("value")).toBe(false);
    expect((screen.getByRole("combobox") as HTMLInputElement).value).toBe("");
    expect(new FormData(form).get("fruit")).toBe("");
  });

  it("emits exactly one change carrying null", async () => {
    const user = userEvent.setup();
    const host = mount(withValue);
    const seen: unknown[] = [];
    host.addEventListener("change", (event) => seen.push((event as CustomEvent).detail.value));

    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(seen).toEqual([null]);
  });

  it("does not bring the selection back when the element reconnects", async () => {
    const user = userEvent.setup();
    const host = mount(withValue);

    await user.click(screen.getByRole("button", { name: "Clear" }));
    const parent = host.parentElement!;
    host.remove();
    parent.appendChild(host);

    expect(host.value).toBeNull();
    expect((screen.getByRole("combobox") as HTMLInputElement).value).toBe("");
  });
});
