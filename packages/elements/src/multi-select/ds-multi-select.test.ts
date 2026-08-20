import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsMultiSelect } from "./ds-multi-select";

const MARKUP = `
  <form data-testid="form">
    <ds-multi-select label="Skills" name="skills">
      <option value="svelte">Svelte</option>
      <option value="vue">Vue</option>
      <option value="react" disabled>React</option>
      <option value="elements">Elements</option>
    </ds-multi-select>
  </form>`;

const mount = (html: string = MARKUP) => {
  document.body.innerHTML = html;
  return document.querySelector("ds-multi-select") as DsMultiSelect;
};
const input = () => screen.getByRole("combobox") as HTMLInputElement;
const listbox = () => screen.getByRole("listbox");
const removeButton = (name: string) => screen.getByRole("button", { name: `Remove ${name}` });
const form = () => screen.getByTestId("form") as HTMLFormElement;

describe("<ds-multi-select>", () => {
  it("renders a labelled input over a multiselectable listbox, closed", () => {
    mount();
    expect(input()).toHaveAttribute("aria-expanded", "false");
    expect(input()).toHaveAttribute("aria-autocomplete", "list");
    expect(input()).toHaveAccessibleName("Skills");
    expect(listbox()).toHaveAttribute("aria-multiselectable", "true");
  });

  it("selects via keyboard, keeps the popup open and emits the array", async () => {
    const user = userEvent.setup();
    const host = mount();
    const onChange = vi.fn();
    host.addEventListener("change", (e) => onChange((e as CustomEvent).detail));

    input().focus();
    await user.keyboard("{ArrowDown}");
    expect(input().getAttribute("aria-activedescendant")).toBeTruthy();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith({ values: ["svelte"] });
    expect(input()).toHaveAttribute("aria-expanded", "true");
    expect(host.values).toEqual(["svelte"]);
    expect(host.getAttribute("values")).toBe("svelte");
    // Reselecting the same, still-listed option is a silent no-op.
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("reflects the values property and attribute both ways, silently", () => {
    const host = mount();
    const onChange = vi.fn();
    host.addEventListener("change", (e) => onChange((e as CustomEvent).detail));

    host.values = ["vue", "svelte"];
    expect(host.getAttribute("values")).toBe("vue svelte");
    expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(2);

    host.setAttribute("values", "elements");
    expect(host.values).toEqual(["elements"]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("upgrades a values property assigned before definition", () => {
    document.body.innerHTML = "";
    const host = document.createElement("ds-multi-select") as DsMultiSelect;
    host.setAttribute("label", "Skills");
    (host as unknown as Record<string, unknown>).values = ["vue"];
    host.items = [{ value: "vue", label: "Vue" }];
    document.body.appendChild(host);
    expect(host.values).toEqual(["vue"]);
    expect(screen.getByRole("list", { name: "Selected values" })).toBeInTheDocument();
  });

  it("submits one hidden input per value in order, none when empty", () => {
    const host = mount();
    expect(new FormData(form()).getAll("skills")).toEqual([]);
    host.values = ["vue", "svelte"];
    expect(new FormData(form()).getAll("skills")).toEqual(["vue", "svelte"]);
  });

  it("renders remove buttons named after the labels; removal moves focus on", async () => {
    const user = userEvent.setup();
    const host = mount();
    host.values = ["svelte", "vue", "elements"];

    removeButton("Vue").focus();
    await user.click(removeButton("Vue"));
    expect(host.values).toEqual(["svelte", "elements"]);
    await vi.waitFor(() => expect(removeButton("Elements")).toHaveFocus());
    await user.click(removeButton("Elements"));
    await vi.waitFor(() => expect(removeButton("Svelte")).toHaveFocus());
    await user.click(removeButton("Svelte"));
    await vi.waitFor(() => expect(input()).toHaveFocus());
  });

  it("Backspace removes only with the opt-in, skipping disabled values", async () => {
    const user = userEvent.setup();
    const host = mount();
    host.values = ["svelte", "react"];

    input().focus();
    await user.keyboard("{Backspace}");
    expect(host.values).toEqual(["svelte", "react"]);

    host.setAttribute("remove-on-backspace", "");
    await user.keyboard("{Backspace}");
    // React (the option) is disabled: Svelte goes first.
    expect(host.values).toEqual(["react"]);
    await user.keyboard("{Backspace}");
    expect(host.values).toEqual(["react"]);
  });

  it("disabled and readonly block opening and removing but keep review", async () => {
    const user = userEvent.setup();
    for (const attr of ["disabled", "readonly"]) {
      const host = mount();
      host.values = ["svelte"];
      host.setAttribute(attr, "");
      input().focus();
      await user.keyboard("{ArrowDown}");
      expect(input()).toHaveAttribute("aria-expanded", "false");
      expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(1);
      expect(screen.queryByRole("button", { name: "Remove Svelte" })).not.toBeInTheDocument();
    }
  });

  it("max blocks additions without pruning existing values", async () => {
    const user = userEvent.setup();
    const host = mount();
    host.setAttribute("max", "1");
    host.values = ["svelte"];
    const onChange = vi.fn();
    host.addEventListener("change", (e) => onChange((e as CustomEvent).detail));

    await user.click(input());
    await user.click(within(listbox()).getByRole("option", { name: "Vue" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(host.values).toEqual(["svelte"]);
  });

  it("keeps a value whose option disappeared, with its raw label", () => {
    const host = mount();
    host.values = ["ghost"];
    host.items = [{ value: "vue", label: "Vue" }];
    expect(screen.getByRole("button", { name: "Remove ghost" })).toBeInTheDocument();
  });

  it("exposes aria-required only when asked and stays light DOM", () => {
    const host = mount();
    expect(host.shadowRoot).toBeNull();
    expect(input()).not.toHaveAttribute("aria-required");
    host.setAttribute("required", "");
    expect(input()).toHaveAttribute("aria-required", "true");
  });

  it("renders hostile labels as text, never as markup", () => {
    document.body.innerHTML = "";
    const host = document.createElement("ds-multi-select") as DsMultiSelect;
    host.setAttribute("label", "Skills");
    host.items = [{ value: "x", label: '<img src=x onerror="window.__pwned = true">' }];
    document.body.appendChild(host);
    host.values = ["x"];
    expect(document.querySelector("img")).toBeNull();
    expect((window as unknown as Record<string, unknown>).__pwned).toBeUndefined();
  });

  it("Escape closes and keeps focus; has no axe violations", async () => {
    const user = userEvent.setup();
    const host = mount();
    host.values = ["svelte"];
    input().focus();
    await user.keyboard("{ArrowDown}");
    expect(input()).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    expect(input()).toHaveAttribute("aria-expanded", "false");
    expect(input()).toHaveFocus();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
