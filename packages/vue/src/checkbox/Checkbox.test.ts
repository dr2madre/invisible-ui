import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Checkbox } from "./Checkbox";

const input = () => screen.getByRole("checkbox") as HTMLInputElement;

describe("Vue Checkbox (styled)", () => {
  it("is a native checkbox named by its label", () => {
    render(Checkbox, { props: { label: "Subscribe" } });
    const el = screen.getByRole("checkbox", { name: "Subscribe" });
    expect(el.tagName).toBe("INPUT");
    expect(el).toHaveAttribute("type", "checkbox");
    expect(el).toHaveAttribute("data-state", "unchecked");
  });

  it("toggles on press and reports the new value", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(Checkbox, { props: { label: "Subscribe", onCheckedChange } });

    await user.click(input());
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(input()).toBeChecked();
    expect(input()).toHaveAttribute("data-state", "checked");
  });

  it("supports v-model: emits update:modelValue on toggle", async () => {
    const user = userEvent.setup();
    const { emitted } = render(Checkbox, { props: { label: "Subscribe", modelValue: false } });

    await user.click(input());
    expect(emitted("update:modelValue")).toEqual([[true]]);
  });

  it("toggles with the Space key (native behaviour)", async () => {
    const user = userEvent.setup();
    render(Checkbox, { props: { label: "Subscribe" } });
    input().focus();
    await user.keyboard(" ");
    expect(input()).toBeChecked();
  });

  it("pressing the visible label toggles it", async () => {
    const user = userEvent.setup();
    render(Checkbox, { props: { label: "Subscribe" } });
    await user.click(screen.getByText("Subscribe"));
    expect(input()).toBeChecked();
  });

  it("renders the indeterminate state as a DOM property", () => {
    render(Checkbox, { props: { label: "Subscribe", checked: "indeterminate" } });
    expect(input().indeterminate).toBe(true);
    expect(input()).not.toBeChecked();
    expect(input()).toHaveAttribute("data-state", "indeterminate");
  });

  it("advances from indeterminate to checked", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(Checkbox, { props: { label: "Subscribe", checked: "indeterminate", onCheckedChange } });
    await user.click(input());
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("mirrors an externally controlled value", async () => {
    const { rerender } = render(Checkbox, { props: { label: "Subscribe", checked: false } });
    expect(input()).not.toBeChecked();
    await rerender({ checked: true });
    expect(input()).toBeChecked();
  });

  it("mirrors an externally controlled v-model value", async () => {
    const { rerender } = render(Checkbox, { props: { label: "Subscribe", modelValue: false } });
    expect(input()).not.toBeChecked();
    await rerender({ modelValue: true });
    expect(input()).toBeChecked();
  });

  it("ignores presses when disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(Checkbox, { props: { label: "Subscribe", disabled: true, onCheckedChange } });
    expect(input()).toBeDisabled();
    await user.click(input());
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("participates in a form with name and value", () => {
    render(Checkbox, {
      props: { label: "Subscribe", name: "news", value: "weekly", checked: true },
    });
    expect(input()).toHaveAttribute("name", "news");
    expect(input()).toHaveAttribute("value", "weekly");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Checkbox, { props: { label: "Subscribe" } });
    expect(await axe(container)).toHaveNoViolations();
  });
});

// Task 5B parity verification: the Vue composable already mirrors checked and
// reads disabled live; these tests pin that contract, matching the Svelte suite.
describe("Vue Checkbox (controlled sync parity)", () => {
  const box = () => screen.getByRole("checkbox", { name: "Accept terms" });

  it("reflects a later checked value, indeterminate included, without a callback", async () => {
    const onCheckedChange = vi.fn();
    const { rerender } = render(Checkbox, {
      props: { label: "Accept terms", checked: false, onCheckedChange },
    });

    await rerender({ label: "Accept terms", checked: true, onCheckedChange });
    expect(box()).toBeChecked();

    await rerender({ label: "Accept terms", checked: "indeterminate", onCheckedChange });
    expect((box() as HTMLInputElement).indeterminate).toBe(true);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("accepts a user action after disabled goes true to false", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    const { rerender } = render(Checkbox, {
      props: { label: "Accept terms", disabled: true, onCheckedChange },
    });

    await rerender({ label: "Accept terms", disabled: false, onCheckedChange });
    await user.click(box());
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("blocks the action after disabled goes false to true", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    const { rerender } = render(Checkbox, {
      props: { label: "Accept terms", disabled: false, onCheckedChange },
    });

    await rerender({ label: "Accept terms", disabled: true, onCheckedChange });
    await user.click(box());
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("hides the label visually while keeping the accessible name", () => {
    render(Checkbox, { props: { label: "Accept terms", hideLabel: true } });
    expect(box()).toHaveAccessibleName("Accept terms");
    expect(document.querySelector(".field__label--hidden")).not.toBeNull();
  });
  it("calls only the replacement callback after the prop is swapped", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(Checkbox, {
      props: { label: "Subscribe", checked: false, onCheckedChange: first },
    });

    await rerender({ label: "Subscribe", checked: false, onCheckedChange: second });
    await user.click(screen.getByRole("checkbox", { name: "Subscribe" }));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith(true);
  });
});
