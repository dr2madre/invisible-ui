import { render, screen, within } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { defineComponent, h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { MultiSelect } from "./MultiSelect";
import type { MultiSelectItem } from "./use-multi-select";

const items: MultiSelectItem[] = [
  { value: "ada", label: "Ada" },
  { value: "grace", label: "Grace" },
  { value: "alan", label: "Alan", disabled: true },
  { value: "edsger", label: "Edsger" },
];

// A form wrapper mirrors the Svelte fixture so FormData is real.
const Fixture = defineComponent({
  props: { msProps: { type: Object, required: true } },
  setup(props) {
    return () =>
      h("form", { "data-testid": "fixture-form", onSubmit: (e: Event) => e.preventDefault() }, [
        h(MultiSelect, { label: "People", items, ...props.msProps }),
        h("button", { type: "submit" }, "Submit"),
      ]);
  },
});

const setup = (msProps: Record<string, unknown> = {}) => render(Fixture, { props: { msProps } });

const input = () => screen.getByRole("combobox", { name: "People" }) as HTMLInputElement;
const option = (name: string) => screen.getByRole("option", { name });
const removeButton = (name: string) => screen.getByRole("button", { name: `Remove ${name}` });
const tagList = () => screen.getByRole("list", { name: "Selected values" });

describe("Vue MultiSelect", () => {
  it("renders a labelled combobox over a multiselectable listbox", () => {
    setup();
    expect(input()).toHaveAttribute("aria-autocomplete", "list");
    expect(screen.getByRole("listbox", { name: "People", hidden: true })).toHaveAttribute(
      "aria-multiselectable",
      "true",
    );
  });

  it("selects with the keyboard, keeps the popup open and stays on the input", async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();
    setup({ onValuesChange });
    input().focus();
    await user.keyboard("{ArrowDown}");
    expect(input().getAttribute("aria-activedescendant")).toContain("option-ada");
    await user.keyboard("{Enter}");
    expect(onValuesChange).toHaveBeenCalledTimes(1);
    expect(onValuesChange).toHaveBeenCalledWith(["ada"]);
    expect(input()).toHaveAttribute("data-state", "open");
    expect(option("Ada")).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{Enter}");
    expect(onValuesChange).toHaveBeenCalledTimes(1);
  });

  it("reflects controlled values without any callback and keeps give-back quiet", async () => {
    const onValuesChange = vi.fn();
    const { rerender } = setup({ onValuesChange });
    await rerender({ msProps: { values: ["grace", "ada"], onValuesChange } });
    expect(within(tagList()).getAllByRole("listitem")).toHaveLength(2);
    await rerender({ msProps: { values: ["grace", "ada"], onValuesChange } });
    expect(onValuesChange).not.toHaveBeenCalled();
  });

  it("calls only the replacement callback after the prop is swapped", async () => {
    const user = userEvent.setup();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = setup({ onValuesChange: first });
    await rerender({ msProps: { onValuesChange: second } });
    input().focus();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("throws in development on duplicated controlled values", () => {
    expect(() => setup({ values: ["ada", "ada"] })).toThrow(
      /\[ds\] `values` must not contain duplicate entries/,
    );
  });

  it("moves focus to the next, then previous remove button, then the input", async () => {
    const user = userEvent.setup();
    let current = ["ada", "grace", "edsger"];
    const { rerender } = setup({
      values: current,
      onValuesChange: (next: string[]) => (current = next),
    });
    const sync = () =>
      rerender({ msProps: { values: current, onValuesChange: (n: string[]) => (current = n) } });
    removeButton("Grace").focus();
    await user.click(removeButton("Grace"));
    await sync();
    expect(document.activeElement).toBe(removeButton("Edsger"));
    await user.click(removeButton("Edsger"));
    await sync();
    expect(document.activeElement).toBe(removeButton("Ada"));
    await user.click(removeButton("Ada"));
    await sync();
    expect(document.activeElement).toBe(input());
  });

  it("keeps a disappeared value selected with its raw label, still removable", async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();
    render(Fixture, {
      props: {
        msProps: { values: ["ghost", "ada"], onValuesChange },
      },
    });
    expect(within(tagList()).getAllByRole("listitem")[0]).toHaveTextContent("ghost");
    await user.click(removeButton("ghost"));
    expect(onValuesChange).toHaveBeenCalledWith(["ada"]);
  });

  describe("Backspace policy", () => {
    it("does nothing by default", async () => {
      const user = userEvent.setup();
      const onValuesChange = vi.fn();
      setup({ values: ["ada"], onValuesChange });
      input().focus();
      await user.keyboard("{Backspace}");
      expect(onValuesChange).not.toHaveBeenCalled();
    });

    it("follows a post-mount change of the opt-in flag", async () => {
      const user = userEvent.setup();
      const onValuesChange = vi.fn();
      const { rerender } = setup({ values: ["ada"], onValuesChange });
      input().focus();
      await user.keyboard("{Backspace}");
      expect(onValuesChange).not.toHaveBeenCalled();
      await rerender({ msProps: { values: ["ada"], onValuesChange, removeOnBackspace: true } });
      input().focus();
      await user.keyboard("{Backspace}");
      expect(onValuesChange).toHaveBeenCalledWith([]);
    });

    it("removes the last removable value when opted in, skipping disabled", async () => {
      const user = userEvent.setup();
      const onValuesChange = vi.fn();
      setup({ values: ["grace", "alan"], removeOnBackspace: true, onValuesChange });
      input().focus();
      await user.keyboard("{Backspace}");
      expect(onValuesChange).toHaveBeenCalledWith(["alan"]);
    });
  });

  it("max blocks additions without pruning; disabled options stay inert", async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();
    setup({ values: ["ada", "grace"], max: 2, onValuesChange });
    input().focus();
    await user.keyboard("{ArrowDown}");
    await user.pointer({ keys: "[MouseLeft>]", target: option("Edsger") });
    expect(onValuesChange).not.toHaveBeenCalled();
    expect(within(tagList()).getAllByRole("listitem")).toHaveLength(2);
  });

  it("disabled and readOnly block opening and removing but keep review", async () => {
    const user = userEvent.setup();
    for (const extra of [{ disabled: true }, { readOnly: true }]) {
      const onValuesChange = vi.fn();
      const { unmount } = setup({ values: ["ada"], onValuesChange, ...extra });
      input().focus();
      await user.keyboard("{ArrowDown}");
      expect(input()).toHaveAttribute("data-state", "closed");
      expect(within(tagList()).getAllByRole("listitem")).toHaveLength(1);
      expect(screen.queryByRole("button", { name: "Remove Ada" })).not.toBeInTheDocument();
      expect(onValuesChange).not.toHaveBeenCalled();
      unmount();
    }
  });

  it("Escape closes and keeps focus on the input", async () => {
    const user = userEvent.setup();
    setup();
    input().focus();
    await user.keyboard("{ArrowDown}");
    expect(input()).toHaveAttribute("data-state", "open");
    await user.keyboard("{Escape}");
    expect(input()).toHaveAttribute("data-state", "closed");
    expect(document.activeElement).toBe(input());
  });

  it("exposes aria-required only when asked", async () => {
    const { rerender } = setup();
    expect(input()).not.toHaveAttribute("aria-required");
    await rerender({ msProps: { required: true } });
    expect(input()).toHaveAttribute("aria-required", "true");
  });

  describe("form participation", () => {
    // The dev-throw test above leaves a partial form in the document, so
    // these queries take the last (current) fixture form.
    const currentForm = () => screen.getAllByTestId("fixture-form").at(-1) as HTMLFormElement;

    it("submits one hidden input per value, in selection order", () => {
      setup({ name: "people", values: ["grace", "ada"] });
      expect(new FormData(currentForm()).getAll("people")).toEqual(["grace", "ada"]);
    });

    it("contributes nothing while the selection is empty", () => {
      setup({ name: "people" });
      expect(new FormData(currentForm()).getAll("people")).toEqual([]);
    });
  });

  it("renders hostile labels as text, never as markup", () => {
    const hostile = '<img src=x onerror="window.__pwned = true">';
    render(MultiSelect, {
      props: { label: "People", items: [{ value: "x", label: hostile }], values: ["x"] },
    });
    expect(document.querySelector("img")).toBeNull();
    expect(tagList()).toHaveTextContent(hostile);
    expect((window as unknown as Record<string, unknown>).__pwned).toBeUndefined();
  });

  it("has no axe violations with values selected", async () => {
    const { container } = setup({ values: ["ada", "grace"] });
    expect(
      await axe(container, { rules: { "color-contrast": { enabled: false } } }),
    ).toHaveNoViolations();
  });
});
