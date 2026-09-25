import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach } from "vitest";
import { axe } from "vitest-axe";
import "../define";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const control = (name: string) => screen.getByRole("button", { name });

const mount = (body = "") => {
  document.body.innerHTML = `
    <ds-toolbar label="Text formatting">
      <ds-button>Bold</ds-button>
      <ds-button>Italic</ds-button>
      <ds-separator orientation="vertical" decorative></ds-separator>
      <button type="button">Align left</button>
      ${body}
    </ds-toolbar>`;
  return document.querySelector("ds-toolbar")!;
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("<ds-toolbar>", () => {
  it("renders a named toolbar containing its controls", () => {
    mount();
    const toolbar = screen.getByRole("toolbar", { name: "Text formatting" });
    expect(toolbar).toHaveAttribute("aria-orientation", "horizontal");
    expect(toolbar).toContainElement(control("Bold"));
    expect(toolbar).toContainElement(control("Align left"));
  });

  it("reflects orientation and flat presentation", () => {
    const host = mount();
    const toolbar = screen.getByRole("toolbar");
    host.setAttribute("orientation", "vertical");
    host.setAttribute("flat", "");
    expect(toolbar).toHaveAttribute("aria-orientation", "vertical");
    expect(toolbar).toHaveAttribute("data-orientation", "vertical");
    expect(toolbar).toHaveAttribute("data-flat");
    host.removeAttribute("flat");
    expect(toolbar).not.toHaveAttribute("data-flat");
  });

  it("exposes a single tab stop (roving tabindex)", async () => {
    mount();
    await waitFor(() => expect(control("Bold")).toHaveAttribute("tabindex", "0"));
    expect(control("Italic")).toHaveAttribute("tabindex", "-1");
    expect(control("Align left")).toHaveAttribute("tabindex", "-1");
  });

  it("moves focus with the arrow keys and wraps, updating the tab stop", async () => {
    const user = userEvent.setup();
    mount();
    const bold = control("Bold");
    const italic = control("Italic");
    const alignLeft = control("Align left");

    bold.focus();
    await user.keyboard("{ArrowRight}");
    expect(italic).toHaveFocus();
    expect(italic).toHaveAttribute("tabindex", "0");
    expect(bold).toHaveAttribute("tabindex", "-1");

    await user.keyboard("{End}");
    expect(alignLeft).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(bold).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(alignLeft).toHaveFocus();
    await user.keyboard("{Home}");
    expect(bold).toHaveFocus();
  });

  it("uses Up and Down when vertical", async () => {
    const user = userEvent.setup();
    mount().setAttribute("orientation", "vertical");
    control("Bold").focus();
    await user.keyboard("{ArrowRight}");
    expect(control("Bold")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(control("Italic")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(control("Bold")).toHaveFocus();
  });

  it("follows the visual direction in right-to-left text", async () => {
    const user = userEvent.setup();
    mount().setAttribute("dir", "rtl");
    control("Bold").focus();
    // The visual start is on the right, so ArrowLeft walks forward.
    await user.keyboard("{ArrowLeft}");
    expect(control("Italic")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(control("Bold")).toHaveFocus();
  });

  it("has no accessibility violations", async () => {
    mount();
    expect(await axe(document.body, noAxeColorContrast)).toHaveNoViolations();
  });
});

// The roving tab stop must survive DOM changes: children can be added,
// removed, or toggle disabled after mount.
describe("<ds-toolbar> (DOM changes)", () => {
  const addUnderline = (host: Element) => {
    const underline = document.createElement("button");
    underline.type = "button";
    underline.textContent = "Underline";
    host.appendChild(underline);
  };

  it("keeps a single tab stop when a control is added", async () => {
    const host = mount();
    addUnderline(host);
    await waitFor(() => expect(control("Underline")).toHaveAttribute("tabindex", "-1"));
    expect(control("Bold")).toHaveAttribute("tabindex", "0");
    // Appended to the host, it still joins the toolbar.
    expect(screen.getByRole("toolbar")).toContainElement(control("Underline"));
  });

  it("moves the tab stop to the first enabled control when its holder is removed", async () => {
    mount();
    control("Italic").focus();
    expect(control("Italic")).toHaveAttribute("tabindex", "0");
    control("Italic").closest("ds-button")!.remove();
    await waitFor(() => expect(control("Bold")).toHaveAttribute("tabindex", "0"));
  });

  it("moves the tab stop off a control that becomes disabled", async () => {
    mount();
    control("Italic").focus();
    control("Italic").closest("ds-button")!.setAttribute("disabled", "");
    await waitFor(() => expect(control("Bold")).toHaveAttribute("tabindex", "0"));
    expect(control("Italic")).toHaveAttribute("tabindex", "-1");
  });

  it("keeps the last focused control as the tab stop across unrelated changes", async () => {
    const host = mount();
    control("Italic").focus();
    addUnderline(host);
    await waitFor(() => expect(control("Underline")).toHaveAttribute("tabindex", "-1"));
    expect(control("Italic")).toHaveAttribute("tabindex", "0");
  });

  it("skips disabled controls with the arrow keys", async () => {
    const user = userEvent.setup();
    mount();
    control("Italic").closest("ds-button")!.setAttribute("disabled", "");
    control("Bold").focus();
    await user.keyboard("{ArrowRight}");
    expect(control("Align left")).toHaveFocus();
  });

  it("takes a re-enabled control back into the arrow-key order", async () => {
    const user = userEvent.setup();
    mount();
    const italicHost = control("Italic").closest("ds-button")!;
    italicHost.setAttribute("disabled", "");
    italicHost.removeAttribute("disabled");
    control("Bold").focus();
    await user.keyboard("{ArrowRight}");
    expect(control("Italic")).toHaveFocus();
  });

  it("enters the Tab order exactly once", async () => {
    const user = userEvent.setup();
    const host = mount();
    addUnderline(host);
    await waitFor(() => expect(control("Underline")).toHaveAttribute("tabindex", "-1"));

    await user.tab();
    expect(control("Bold")).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("toolbar").contains(document.activeElement)).toBe(false);
  });
});
