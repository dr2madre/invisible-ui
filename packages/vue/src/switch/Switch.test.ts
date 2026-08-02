import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { LocaleProvider } from "../i18n/i18n";
import { Switch } from "./Switch";

const control = () => screen.getByRole("switch") as HTMLInputElement;

describe("Vue Switch (styled)", () => {
  it("exposes role=switch named by its label", () => {
    render(Switch, { props: { label: "Notifications" } });
    const el = screen.getByRole("switch", { name: "Notifications" });
    expect(el.tagName).toBe("INPUT");
    expect(el).toHaveAttribute("data-state", "unchecked");
  });

  it("turns on when pressed and reports the value", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(Switch, { props: { label: "Notifications", onCheckedChange } });

    await user.click(control());
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(control()).toBeChecked();
    expect(control()).toHaveAttribute("data-state", "checked");
  });

  it("supports v-model: emits update:modelValue on toggle", async () => {
    const user = userEvent.setup();
    const { emitted } = render(Switch, { props: { label: "Notifications", modelValue: false } });

    await user.click(control());
    expect(emitted("update:modelValue")).toEqual([[true]]);
  });

  it("toggles with the Space key (native behaviour)", async () => {
    const user = userEvent.setup();
    render(Switch, { props: { label: "Notifications" } });
    control().focus();
    await user.keyboard(" ");
    expect(control()).toBeChecked();
  });

  it("mirrors an externally controlled value", async () => {
    const { rerender } = render(Switch, { props: { label: "Notifications", checked: false } });
    expect(control()).not.toBeChecked();
    await rerender({ checked: true });
    expect(control()).toBeChecked();
  });

  it("mirrors an externally controlled v-model value", async () => {
    const { rerender } = render(Switch, { props: { label: "Notifications", modelValue: false } });
    expect(control()).not.toBeChecked();
    await rerender({ modelValue: true });
    expect(control()).toBeChecked();
  });

  it("ignores presses when disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(Switch, { props: { label: "Notifications", disabled: true, onCheckedChange } });
    expect(control()).toBeDisabled();
    await user.click(control());
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("shows ON/OFF text in the track for the labelled variant", () => {
    render(Switch, { props: { label: "Notifications", onOff: true } });
    expect(screen.getByText("ON")).toBeInTheDocument();
    expect(screen.getByText("OFF")).toBeInTheDocument();
  });

  it("takes the ON/OFF text from the locale catalog", () => {
    render(LocaleProvider, {
      props: { messages: { "switch.on": "SÌ", "switch.off": "NO" } },
      slots: { default: () => h(Switch, { label: "Notifiche", onOff: true }) },
    });
    expect(screen.getByText("SÌ")).toBeInTheDocument();
    expect(screen.getByText("NO")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Switch, { props: { label: "Notifications" } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
