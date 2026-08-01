import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsCheckbox } from "./ds-checkbox";

const mount = (html: string) => {
  document.body.innerHTML = html;
  return document.querySelector("ds-checkbox") as DsCheckbox;
};
const input = () => screen.getByRole("checkbox") as HTMLInputElement;

describe("<ds-checkbox>", () => {
  it("is a native checkbox named by its label", () => {
    mount(`<ds-checkbox label="Subscribe"></ds-checkbox>`);
    const el = screen.getByRole("checkbox", { name: "Subscribe" });
    expect(el.tagName).toBe("INPUT");
    expect(el).toHaveAttribute("data-state", "unchecked");
  });

  it("toggles on press and emits change with the new value", async () => {
    const user = userEvent.setup();
    const host = mount(`<ds-checkbox label="Subscribe"></ds-checkbox>`);
    const onChange = vi.fn();
    host.addEventListener("change", (e) => onChange((e as CustomEvent).detail));

    await user.click(input());
    expect(onChange).toHaveBeenCalledWith({ checked: true });
    expect(input()).toBeChecked();
    expect(host.checked).toBe(true);
    // The host reflects state as an attribute for CSS and server rendering.
    expect(host).toHaveAttribute("checked");
  });

  it("emits exactly one change per toggle (no double native+custom)", async () => {
    const user = userEvent.setup();
    const host = mount(`<ds-checkbox label="Subscribe"></ds-checkbox>`);
    const onChange = vi.fn();
    host.addEventListener("change", onChange);
    await user.click(input());
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("renders the indeterminate state as a DOM property via rootDomProps", () => {
    mount(`<ds-checkbox label="Subscribe" indeterminate></ds-checkbox>`);
    expect(input().indeterminate).toBe(true);
    expect(input()).toHaveAttribute("data-state", "indeterminate");
  });

  it("is controllable through the checked property", () => {
    const host = mount(`<ds-checkbox label="Subscribe"></ds-checkbox>`);
    host.checked = true;
    expect(input()).toBeChecked();
    host.checked = "indeterminate";
    expect(input().indeterminate).toBe(true);
  });

  it("ignores presses when disabled", async () => {
    const user = userEvent.setup();
    const host = mount(`<ds-checkbox label="Subscribe" disabled></ds-checkbox>`);
    const onChange = vi.fn();
    host.addEventListener("change", onChange);
    expect(input()).toBeDisabled();
    await user.click(input());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("participates in a native form", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `<form><ds-checkbox label="News" name="news" value="weekly"></ds-checkbox></form>`;
    await user.click(input());
    const data = new FormData(document.querySelector("form")!);
    expect(data.get("news")).toBe("weekly");
  });

  it("has no accessibility violations", async () => {
    mount(`<ds-checkbox label="Subscribe"></ds-checkbox>`);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
