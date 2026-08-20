import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./multi-select.fixture.svelte";

const input = () => screen.getByRole("combobox", { name: "People" }) as HTMLInputElement;
const option = (name: string) => screen.getByRole("option", { name });
const removeButton = (name: string) => screen.getByRole("button", { name: `Remove ${name}` });
const tagList = () => screen.getByRole("list", { name: "Selected values" });

const openWith = async (key = "ArrowDown") => {
  input().focus();
  await fireEvent.keyDown(input(), { key });
};

describe("Svelte MultiSelect", () => {
  it("renders a labelled combobox over a multiselectable listbox", () => {
    render(Fixture);
    expect(input()).toHaveAttribute("aria-autocomplete", "list");
    expect(screen.getByRole("listbox", { name: "People", hidden: true })).toHaveAttribute(
      "aria-multiselectable",
      "true",
    );
  });

  it("selects with the keyboard, keeps the popup open and stays on the input", async () => {
    const onValuesChange = vi.fn();
    render(Fixture, { props: { onValuesChange, bindValues: true } });
    await openWith();
    expect(input().getAttribute("aria-activedescendant")).toContain("option-ada");
    await fireEvent.keyDown(input(), { key: "Enter" });
    expect(onValuesChange).toHaveBeenCalledTimes(1);
    expect(onValuesChange).toHaveBeenCalledWith(["ada"]);
    expect(input()).toHaveAttribute("data-state", "open");
    expect(option("Ada")).toHaveAttribute("aria-selected", "true");
    // Another Enter on the same, still-listed option is a silent no-op.
    await fireEvent.keyDown(input(), { key: "Enter" });
    expect(onValuesChange).toHaveBeenCalledTimes(1);
  });

  it("adds by pointer and renders ordered tags with named remove buttons", async () => {
    render(Fixture, { props: { bindValues: true } });
    await openWith();
    await fireEvent.mouseDown(option("Grace"));
    await fireEvent.mouseDown(option("Ada"));
    const tags = within(tagList()).getAllByRole("listitem");
    expect(tags.map((tag) => tag.textContent?.trim())).toEqual(["Grace", "Ada"]);
    expect(removeButton("Grace")).toBeInTheDocument();
    expect(removeButton("Ada")).toBeInTheDocument();
  });

  it("reflects controlled values without any callback and keeps give-back quiet", async () => {
    const onValuesChange = vi.fn();
    const { rerender } = render(Fixture, { props: { onValuesChange } });
    await rerender({ values: ["grace", "ada"] });
    expect(within(tagList()).getAllByRole("listitem")).toHaveLength(2);
    expect(onValuesChange).not.toHaveBeenCalled();
    // Same content, new reference: the mirror stays quiet.
    await rerender({ values: ["grace", "ada"] });
    expect(onValuesChange).not.toHaveBeenCalled();
  });

  it("calls only the replacement callback after the prop is swapped", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(Fixture, { props: { onValuesChange: first } });
    await rerender({ onValuesChange: second });
    await openWith();
    await fireEvent.keyDown(input(), { key: "Enter" });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("throws in development on duplicated controlled values", () => {
    expect(() => render(Fixture, { props: { values: ["ada", "ada"] } })).toThrow(
      /\[ds\] `values` must not contain duplicate entries/,
    );
  });

  it("moves focus to the next, then previous remove button, then the input", async () => {
    render(Fixture, { props: { values: ["ada", "grace", "edsger"], bindValues: true } });
    removeButton("Grace").focus();
    await fireEvent.click(removeButton("Grace"));
    // The next button now sits at the removed index.
    expect(document.activeElement).toBe(removeButton("Edsger"));
    await fireEvent.click(removeButton("Edsger"));
    expect(document.activeElement).toBe(removeButton("Ada"));
    await fireEvent.click(removeButton("Ada"));
    expect(document.activeElement).toBe(input());
  });

  it("keeps a disappeared value selected with its raw label, still removable", async () => {
    const onValuesChange = vi.fn();
    render(Fixture, {
      props: {
        values: ["ghost", "ada"],
        items: [{ value: "ada", label: "Ada" }],
        onValuesChange,
      },
    });
    expect(within(tagList()).getAllByRole("listitem")[0]).toHaveTextContent("ghost");
    await fireEvent.click(removeButton("ghost"));
    expect(onValuesChange).toHaveBeenCalledWith(["ada"]);
  });

  describe("Backspace policy", () => {
    it("does nothing by default", async () => {
      const onValuesChange = vi.fn();
      render(Fixture, { props: { values: ["ada"], onValuesChange } });
      input().focus();
      await fireEvent.keyDown(input(), { key: "Backspace" });
      expect(onValuesChange).not.toHaveBeenCalled();
    });

    it("follows a post-mount change of the opt-in flag", async () => {
      const onValuesChange = vi.fn();
      const { rerender } = render(Fixture, { props: { values: ["ada"], onValuesChange } });
      input().focus();
      await fireEvent.keyDown(input(), { key: "Backspace" });
      expect(onValuesChange).not.toHaveBeenCalled();
      await rerender({ removeOnBackspace: true });
      await fireEvent.keyDown(input(), { key: "Backspace" });
      expect(onValuesChange).toHaveBeenCalledWith([]);
    });

    it("removes the last removable value when opted in, skipping disabled", async () => {
      const onValuesChange = vi.fn();
      render(Fixture, {
        props: {
          values: ["grace", "alan"],
          removeOnBackspace: true,
          onValuesChange,
          bindValues: true,
        },
      });
      input().focus();
      await fireEvent.keyDown(input(), { key: "Backspace" });
      expect(onValuesChange).toHaveBeenCalledWith(["alan"]);
      // Only Alan (disabled) is left: another Backspace is a no-op.
      await fireEvent.keyDown(input(), { key: "Backspace" });
      expect(onValuesChange).toHaveBeenCalledTimes(1);
    });
  });

  it("max blocks additions without pruning; disabled options get no tag button", async () => {
    const onValuesChange = vi.fn();
    render(Fixture, { props: { values: ["ada", "grace"], max: 2, onValuesChange } });
    await openWith();
    await fireEvent.mouseDown(option("Edsger"));
    expect(onValuesChange).not.toHaveBeenCalled();
    expect(within(tagList()).getAllByRole("listitem")).toHaveLength(2);
  });

  it("disabled and readOnly block opening and removing but keep review", async () => {
    for (const props of [{ disabled: true }, { readOnly: true }]) {
      const onValuesChange = vi.fn();
      const { unmount } = render(Fixture, {
        props: { values: ["ada"], onValuesChange, ...props },
      });
      await openWith();
      expect(input()).toHaveAttribute("data-state", "closed");
      expect(within(tagList()).getAllByRole("listitem")).toHaveLength(1);
      expect(screen.queryByRole("button", { name: "Remove Ada" })).not.toBeInTheDocument();
      expect(onValuesChange).not.toHaveBeenCalled();
      unmount();
    }
  });

  it("Escape closes and keeps focus on the input", async () => {
    render(Fixture);
    await openWith();
    input().focus();
    await fireEvent.keyDown(input(), { key: "Escape" });
    expect(input()).toHaveAttribute("data-state", "closed");
    expect(document.activeElement).toBe(input());
  });

  it("exposes aria-required only when asked", async () => {
    const { rerender } = render(Fixture);
    expect(input()).not.toHaveAttribute("aria-required");
    await rerender({ required: true });
    expect(input()).toHaveAttribute("aria-required", "true");
  });

  describe("form participation", () => {
    it("submits one hidden input per value, in selection order", async () => {
      render(Fixture, { props: { name: "people", values: ["grace", "ada"] } });
      const form = screen.getByTestId("fixture-form") as HTMLFormElement;
      expect(new FormData(form).getAll("people")).toEqual(["grace", "ada"]);
    });

    it("contributes nothing while the selection is empty", () => {
      render(Fixture, { props: { name: "people" } });
      const form = screen.getByTestId("fixture-form") as HTMLFormElement;
      expect(new FormData(form).getAll("people")).toEqual([]);
    });
  });

  it("renders hostile labels as text, never as markup", () => {
    const hostile = '<img src=x onerror="window.__pwned = true">';
    render(Fixture, {
      props: { items: [{ value: "x", label: hostile }], values: ["x"] },
    });
    expect(document.querySelector("img")).toBeNull();
    expect(tagList()).toHaveTextContent(hostile);
    expect((window as unknown as Record<string, unknown>).__pwned).toBeUndefined();
  });

  it("has no axe violations with values selected", async () => {
    const { container } = render(Fixture, { props: { values: ["ada", "grace"] } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
