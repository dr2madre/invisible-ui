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
const toggle = (pressed?: boolean) => screen.getByRole("button", { name: "Bold", pressed });

/** The restore runs one task after the reset event; wait past it. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("<ds-toggle-button>", () => {
  it("renders an unpressed native button named by its label", () => {
    mount();
    expect(toggle(false)).toHaveAttribute("type", "button");
    expect(toggle()).toHaveClass("toggle");
    expect(toggle()).toHaveAttribute("data-state", "off");
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("takes its name from the content when there is no label", () => {
    document.body.innerHTML = `<ds-toggle-button>Italic</ds-toggle-button>`;
    expect(screen.getByRole("button", { name: "Italic", pressed: false })).toBeInTheDocument();
  });

  it("toggles on click, reporting changes", async () => {
    const user = userEvent.setup();
    const host = mount();
    const seen: boolean[] = [];
    host.addEventListener("change", (event) => seen.push((event as CustomEvent).detail.pressed));

    await user.click(toggle());
    expect(toggle(true)).toHaveAttribute("data-state", "on");
    expect(host.pressed).toBe(true);

    await user.click(toggle());
    expect(toggle(false)).toBeInTheDocument();
    expect(seen).toEqual([true, false]);
  });

  it("toggles with Enter and Space", async () => {
    const user = userEvent.setup();
    mount();
    toggle().focus();

    await user.keyboard("{Enter}");
    expect(toggle(true)).toHaveFocus();
    await user.keyboard(" ");
    expect(toggle(false)).toHaveFocus();
  });

  it("keeps the same name in both states", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `<ds-toggle-button>Bold</ds-toggle-button>`;
    const button = screen.getByRole("button", { name: "Bold", pressed: false });
    await user.click(button);
    expect(screen.getByRole("button", { name: "Bold", pressed: true })).toBe(button);
  });

  it("toggles when the visible surface is pressed", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByText("B"));
    expect(toggle(true)).toBeInTheDocument();
  });

  it("starts from the pressed attribute", () => {
    mount("pressed");
    expect(toggle(true)).toBeInTheDocument();
  });

  it("follows the pressed property without reporting a change", () => {
    const host = mount();
    const seen = vi.fn();
    host.addEventListener("change", seen);
    host.pressed = true;
    expect(toggle(true)).toBeInTheDocument();
    host.pressed = false;
    expect(toggle(false)).toBeInTheDocument();
    expect(seen).not.toHaveBeenCalled();
  });

  it("shows the checkmark only while pressed when check is set", async () => {
    const user = userEvent.setup();
    mount("check");
    expect(document.querySelector(".toggle__check")).toBeNull();
    await user.click(toggle());
    expect(document.querySelector(".toggle__check")).toHaveAttribute("aria-hidden", "true");
    expect(toggle(true)).toBeInTheDocument();
    await user.click(toggle());
    expect(document.querySelector(".toggle__check")).toBeNull();
  });

  it("submits its value under the name only while pressed", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `<form><ds-toggle-button label="Bold" name="bold" value="yes">B</ds-toggle-button></form>`;
    const form = document.querySelector("form")!;
    expect(new FormData(form).get("bold")).toBeNull();

    await user.click(toggle());
    expect(new FormData(form).getAll("bold")).toEqual(["yes"]);

    await user.click(toggle());
    expect(new FormData(form).get("bold")).toBeNull();
  });

  it("submits on when no value is given", () => {
    document.body.innerHTML = `<form><ds-toggle-button label="Bold" name="bold" pressed>B</ds-toggle-button></form>`;
    expect(new FormData(document.querySelector("form")!).get("bold")).toBe("on");
  });

  it("puts the default pressed value back on form reset, silently", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `<form><ds-toggle-button label="Bold" name="bold" pressed>B</ds-toggle-button></form>`;
    const form = document.querySelector("form")!;
    const host = document.querySelector("ds-toggle-button") as DsToggleButton;
    const seen = vi.fn();
    host.addEventListener("change", seen);

    await user.click(toggle());
    expect(new FormData(form).get("bold")).toBeNull();
    seen.mockClear();

    form.reset();
    await settled();
    expect(toggle(true)).toBeInTheDocument();
    expect(host.pressed).toBe(true);
    expect(new FormData(form).get("bold")).toBe("on");
    expect(seen).not.toHaveBeenCalled();
  });

  it("treats a page echoing a press as no new default, and a later write as one", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `<form><ds-toggle-button label="Bold" name="bold">B</ds-toggle-button></form>`;
    const form = document.querySelector("form")!;
    const host = document.querySelector("ds-toggle-button") as DsToggleButton;

    await user.click(toggle());
    host.pressed = true;
    form.reset();
    await settled();
    expect(toggle(false)).toBeInTheDocument();

    host.pressed = true;
    await user.click(toggle());
    form.reset();
    await settled();
    expect(toggle(true), "a value the page chose is the new default").toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    mount("pressed check");
    expect(await axe(document.body, noAxeColorContrast)).toHaveNoViolations();
  });
});

// Disabled is live: the page can turn the control off and on while it is shown.
describe("<ds-toggle-button> disabled after mount", () => {
  it("disables the native button", () => {
    const host = mount();
    expect(toggle()).toBeEnabled();

    host.disabled = true;
    expect(toggle()).toBeDisabled();
    expect(toggle()).toHaveAttribute("data-disabled", "");
  });

  it("keeps the pressed value while disabled, reports nothing and submits nothing", async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `<form><ds-toggle-button label="Bold" name="bold" pressed>B</ds-toggle-button></form>`;
    const form = document.querySelector("form")!;
    const host = document.querySelector("ds-toggle-button") as DsToggleButton;
    const seen = vi.fn();
    host.addEventListener("change", seen);

    host.disabled = true;
    await user.click(toggle());
    toggle().focus();
    await user.keyboard("{Enter} ");
    expect(toggle(true)).toBeInTheDocument();
    expect(seen).not.toHaveBeenCalled();
    expect(new FormData(form).get("bold")).toBeNull();
  });

  it("restores pointer and keyboard activation when re-enabled", async () => {
    const user = userEvent.setup();
    const host = mount("disabled");
    const seen: boolean[] = [];
    host.addEventListener("change", (event) => seen.push((event as CustomEvent).detail.pressed));

    host.disabled = false;
    await user.click(toggle());
    expect(toggle(true)).toBeInTheDocument();
    await user.keyboard(" ");
    expect(toggle(false)).toBeInTheDocument();
    expect(seen).toEqual([true, false]);
  });

  it("accepts a new pressed value in the same turn that re-enables it", () => {
    const host = mount("disabled");
    host.disabled = false;
    host.pressed = true;
    expect(toggle(true)).toHaveAttribute("data-state", "on");
  });
});
