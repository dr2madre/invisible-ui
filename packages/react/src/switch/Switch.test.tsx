import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { LocaleProvider } from "../i18n/i18n";
import { Switch } from "./Switch";

const control = () => screen.getByRole("switch") as HTMLInputElement;

describe("React Switch (styled)", () => {
  it("exposes role=switch named by its label", () => {
    render(<Switch label="Notifications" />);
    const el = screen.getByRole("switch", { name: "Notifications" });
    expect(el.tagName).toBe("INPUT");
    expect(el).toHaveAttribute("data-state", "unchecked");
  });

  it("turns on when pressed and reports the value", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch label="Notifications" onCheckedChange={onCheckedChange} />);

    await user.click(control());
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(control()).toBeChecked();
    expect(control()).toHaveAttribute("data-state", "checked");
  });

  it("toggles with the Space key (native behaviour)", async () => {
    const user = userEvent.setup();
    render(<Switch label="Notifications" />);
    control().focus();
    await user.keyboard(" ");
    expect(control()).toBeChecked();
  });

  it("mirrors an externally controlled value", () => {
    const { rerender } = render(<Switch label="Notifications" checked={false} />);
    expect(control()).not.toBeChecked();
    rerender(<Switch label="Notifications" checked={true} />);
    expect(control()).toBeChecked();
  });

  it("ignores presses when disabled", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch label="Notifications" disabled onCheckedChange={onCheckedChange} />);
    expect(control()).toBeDisabled();
    await user.click(control());
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it("shows ON/OFF text in the track for the labelled variant", () => {
    render(<Switch label="Notifications" onOff />);
    expect(screen.getByText("ON")).toBeInTheDocument();
    expect(screen.getByText("OFF")).toBeInTheDocument();
  });

  it("takes the ON/OFF text from the locale catalog", () => {
    render(
      <LocaleProvider messages={{ "switch.on": "SÌ", "switch.off": "NO" }}>
        <Switch label="Notifiche" onOff />
      </LocaleProvider>,
    );
    expect(screen.getByText("SÌ")).toBeInTheDocument();
    expect(screen.getByText("NO")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Switch label="Notifications" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
