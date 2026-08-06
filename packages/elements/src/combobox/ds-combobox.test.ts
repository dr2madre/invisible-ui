import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
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

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    mount();
    await user.type(input(), "a");
    expect(input()).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    expect(input()).toHaveAttribute("aria-expanded", "false");
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

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    mount();
    await user.type(input(), "a");
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
