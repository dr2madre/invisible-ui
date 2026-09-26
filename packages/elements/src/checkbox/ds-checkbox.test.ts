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

  it("hides the label from view while it keeps naming the control", () => {
    const host = mount(`<ds-checkbox label="Select Ada" hide-label></ds-checkbox>`);
    expect(screen.getByRole("checkbox", { name: "Select Ada" })).toBeInTheDocument();
    expect(host.querySelector(".field__label")).toHaveClass("field__label--hidden");
    host.removeAttribute("hide-label");
    expect(host.querySelector(".field__label")).not.toHaveClass("field__label--hidden");
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
    const host = mount(`<ds-checkbox label="Subscribe" indeterminate></ds-checkbox>`);
    expect(input().indeterminate).toBe(true);
    expect(input()).toHaveAttribute("data-state", "indeterminate");
    expect(host.querySelector("svg.checkbox__check")).not.toBeNull();
    expect(host.querySelector("svg.checkbox__dash")).not.toBeNull();
  });

  it("moves through unchecked, checked and indeterminate state", () => {
    const host = mount(`<ds-checkbox label="Subscribe"></ds-checkbox>`);
    expect(input()).not.toBeChecked();
    expect(input().indeterminate).toBe(false);

    host.checked = true;
    expect(input()).toBeChecked();
    expect(input().indeterminate).toBe(false);

    host.checked = "indeterminate";
    expect(input()).not.toBeChecked();
    expect(input().indeterminate).toBe(true);

    host.checked = false;
    expect(input()).not.toBeChecked();
    expect(input().indeterminate).toBe(false);
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

  it("the label and form attributes drive the control after the first render", () => {
    const host = mount(`<ds-checkbox label="Subscribe" name="news"></ds-checkbox>`);
    const input = screen.getByRole("checkbox") as HTMLInputElement;
    expect(input.name).toBe("news");

    host.setAttribute("label", "Join the list");
    host.setAttribute("name", "updates");
    host.setAttribute("value", "weekly");
    host.setAttribute("required", "");

    expect(screen.getByRole("checkbox", { name: "Join the list" })).toBe(input);
    expect(input.name).toBe("updates");
    expect(input.value).toBe("weekly");
    expect(input.required).toBe(true);
  });

  it("has no accessibility violations", async () => {
    mount(`<ds-checkbox label="Subscribe"></ds-checkbox>`);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
