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

  it("the label attribute drives the caption after the first render", () => {
    const host = mount(`<ds-switch label="Notifications"></ds-switch>`);
    expect(screen.getByRole("switch", { name: "Notifications" })).toBeInTheDocument();

    host.setAttribute("label", "Alerts");
    expect(screen.getByRole("switch", { name: "Alerts" })).toBeInTheDocument();
  });

  it("the form attributes drive the input after the first render", () => {
    const host = mount(`<ds-switch label="Notifications" name="notify"></ds-switch>`);
    const input = screen.getByRole("switch") as HTMLInputElement;
    expect(input.name).toBe("notify");

    host.setAttribute("name", "alerts");
    host.setAttribute("value", "yes");
    host.setAttribute("required", "");

    expect(input.name).toBe("alerts");
    expect(input.value).toBe("yes");
    expect(input.required).toBe(true);
  });

  it("the on-off attribute builds and tears down the track captions", () => {
    const host = mount(`<ds-switch label="Notifications"></ds-switch>`);
    const track = document.querySelector(".switch")!;
    expect(track.querySelector(".switch__on")).toBeNull();

    host.setAttribute("on-off", "");
    expect(track).toHaveClass("switch--onoff");
    expect(track.querySelector(".switch__on")).toHaveTextContent("ON");

    host.removeAttribute("on-off");
    expect(track).not.toHaveClass("switch--onoff");
    expect(track.querySelector(".switch__on")).toBeNull();
  });

  it("the on-text and off-text attributes drive the track captions", () => {
    const host = mount(`<ds-switch label="Notifications" on-off></ds-switch>`);
    expect(document.querySelector(".switch__on")).toHaveTextContent("ON");

    host.setAttribute("on-text", "SÌ");
    host.setAttribute("off-text", "NO");

    expect(document.querySelector(".switch__on")).toHaveTextContent("SÌ");
    expect(document.querySelector(".switch__off")).toHaveTextContent("NO");
  });

  it("has no accessibility violations", async () => {
    mount(`<ds-switch label="Notifications"></ds-switch>`);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
