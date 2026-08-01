import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsSwitch } from "./ds-switch";

const mount = (html: string) => {
  document.body.innerHTML = html;
  return document.querySelector("ds-switch") as DsSwitch;
};
const control = () => screen.getByRole("switch") as HTMLInputElement;

describe("<ds-switch>", () => {
  it("exposes role=switch named by its label", () => {
    mount(`<ds-switch label="Notifications"></ds-switch>`);
    const el = screen.getByRole("switch", { name: "Notifications" });
    expect(el.tagName).toBe("INPUT");
    expect(el).toHaveAttribute("data-state", "unchecked");
  });

  it("turns on when pressed and emits change", async () => {
    const user = userEvent.setup();
    const host = mount(`<ds-switch label="Notifications"></ds-switch>`);
    const onChange = vi.fn();
    host.addEventListener("change", (e) => onChange((e as CustomEvent).detail));

    await user.click(control());
    expect(onChange).toHaveBeenCalledWith({ checked: true });
    expect(control()).toBeChecked();
    expect(host.checked).toBe(true);
  });

  it("is controllable through the checked property/attribute", () => {
    const host = mount(`<ds-switch label="Notifications" checked></ds-switch>`);
    expect(control()).toBeChecked();
    host.checked = false;
    expect(control()).not.toBeChecked();
  });

  it("ignores presses when disabled", async () => {
    const user = userEvent.setup();
    const host = mount(`<ds-switch label="Notifications" disabled></ds-switch>`);
    const onChange = vi.fn();
    host.addEventListener("change", onChange);
    await user.click(control());
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows custom ON/OFF text in the track", () => {
    mount(`<ds-switch label="N" on-off on-text="YES" off-text="NO"></ds-switch>`);
    expect(document.querySelector(".switch__on")!.textContent).toBe("YES");
    expect(document.querySelector(".switch__off")!.textContent).toBe("NO");
  });

  it("participates in a native form", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `<form><ds-switch label="N" name="notify" value="yes"></ds-switch></form>`;
    await user.click(control());
    expect(new FormData(document.querySelector("form")!).get("notify")).toBe("yes");
  });

  it("has no accessibility violations", async () => {
    mount(`<ds-switch label="Notifications"></ds-switch>`);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
