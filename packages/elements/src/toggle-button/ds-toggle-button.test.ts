import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsToggleButton } from "./ds-toggle-button";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const mount = (attrs = "") => {
  document.body.innerHTML = `<ds-toggle-button label="Bold" ${attrs}>B</ds-toggle-button>`;
  return document.querySelector("ds-toggle-button") as DsToggleButton;
};
const toggle = () => screen.getByRole("checkbox", { name: "Bold" });

describe("<ds-toggle-button>", () => {
  it("renders an unpressed native checkbox named by its label", () => {
    mount();
    expect(toggle()).toHaveAttribute("type", "checkbox");
    expect(toggle()).not.toBeChecked();
    expect(toggle()).toHaveAttribute("data-state", "off");
  });

  it("takes its name from the content when there is no label", () => {
    document.body.innerHTML = `<ds-toggle-button>Italic</ds-toggle-button>`;
    expect(screen.getByRole("checkbox", { name: "Italic" })).toBeInTheDocument();
  });

  it("toggles on click and the keyboard, reporting changes", async () => {
    const user = userEvent.setup();
    const host = mount();
    const seen: boolean[] = [];
    host.addEventListener("change", (event) => seen.push((event as CustomEvent).detail.pressed));

    await user.click(toggle());
    expect(toggle()).toBeChecked();
    expect(toggle()).toHaveAttribute("data-state", "on");
    expect(host.pressed).toBe(true);

    await user.keyboard(" ");
    expect(toggle()).not.toBeChecked();
    expect(seen).toEqual([true, false]);
  });

  it("toggles when the visible surface is pressed", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByText("B"));
    expect(toggle()).toBeChecked();
  });

  it("starts from the pressed attribute", () => {
    mount("pressed");
    expect(toggle()).toBeChecked();
  });

  it("shows the checkmark only while pressed when check is set", async () => {
    const user = userEvent.setup();
    mount("check");
    expect(document.querySelector(".toggle__check")).toBeNull();
    await user.click(toggle());
    expect(document.querySelector(".toggle__check")).toHaveAttribute("aria-hidden", "true");
    await user.click(toggle());
    expect(document.querySelector(".toggle__check")).toBeNull();
  });

  it("submits its value under the name while pressed", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `<form><ds-toggle-button label="Bold" name="bold" value="yes">B</ds-toggle-button></form>`;
    const form = document.querySelector("form")!;
    expect(new FormData(form).get("bold")).toBeNull();

    await user.click(toggle());
    expect(new FormData(form).get("bold")).toBe("yes");
  });

  it("has no accessibility violations", async () => {
    mount("pressed check");
    expect(await axe(document.body, noAxeColorContrast)).toHaveNoViolations();
  });
});

// Disabled is live: the page can turn the control off and on while it is shown.
describe("<ds-toggle-button> disabled after mount", () => {
  it("disables the native input and its styling", () => {
    const host = mount();
    expect(toggle()).toBeEnabled();

    host.disabled = true;
    expect(toggle()).toBeDisabled();
    expect(toggle()).toHaveAttribute("data-disabled", "");
    expect(host).toHaveClass("toggle--disabled");
  });

  it("keeps the pressed value while disabled and reports nothing", async () => {
    const user = userEvent.setup();
    const host = mount("pressed");
    const seen = vi.fn();
    host.addEventListener("change", seen);

    host.disabled = true;
    await user.click(toggle());
    expect(toggle()).toBeChecked();
    expect(seen).not.toHaveBeenCalled();
  });

  it("restores pointer and keyboard activation when re-enabled", async () => {
    const user = userEvent.setup();
    const host = mount("disabled");
    const seen: boolean[] = [];
    host.addEventListener("change", (event) => seen.push((event as CustomEvent).detail.pressed));

    host.disabled = false;
    await user.click(toggle());
    expect(toggle()).toBeChecked();
    await user.keyboard(" ");
    expect(toggle()).not.toBeChecked();
    expect(seen).toEqual([true, false]);
  });

  it("accepts a new pressed value in the same turn that re-enables it", () => {
    const host = mount("disabled");
    host.disabled = false;
    host.pressed = true;
    expect(toggle()).toBeChecked();
    expect(toggle()).toHaveAttribute("data-state", "on");
  });
});
