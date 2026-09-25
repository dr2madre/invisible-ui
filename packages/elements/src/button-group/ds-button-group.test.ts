import { screen, within } from "@testing-library/dom";
import { axe } from "vitest-axe";
import "../define";
import type { DsButtonGroup } from "./ds-button-group";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const mount = (attributes = `label="Text alignment"`) => {
  document.body.innerHTML = `
    <ds-button-group ${attributes}>
      <ds-button>Left</ds-button>
      <ds-button>Center</ds-button>
      <ds-button>Right</ds-button>
    </ds-button-group>`;
  return document.querySelector("ds-button-group") as DsButtonGroup;
};

describe("<ds-button-group>", () => {
  it("renders a labelled, horizontal, attached group around its buttons", () => {
    mount();
    const group = screen.getByRole("group", { name: "Text alignment" });
    expect(group).toHaveAttribute("data-orientation", "horizontal");
    expect(group).toHaveClass("button-group", "button-group--attached");
    expect(within(group).getAllByRole("button")).toHaveLength(3);
  });

  it("keeps each button an independent tab stop (no roving tabindex)", () => {
    mount();
    const group = screen.getByRole("group", { name: "Text alignment" });
    for (const button of within(group).getAllByRole("button")) {
      expect(button).not.toHaveAttribute("tabindex");
    }
  });

  it("reflects the vertical orientation as a styling hook", () => {
    const host = mount(`label="Text alignment" orientation="vertical"`);
    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("data-orientation", "vertical");
    expect(group).toHaveClass("button-group--vertical");

    host.setAttribute("orientation", "horizontal");
    expect(group).not.toHaveClass("button-group--vertical");
  });

  it("spaces the buttons apart when attached is off", () => {
    const host = mount(`label="Text alignment" attached="false"`);
    expect(screen.getByRole("group")).not.toHaveClass("button-group--attached");
    host.attached = true;
    expect(screen.getByRole("group")).toHaveClass("button-group--attached");
  });

  it("follows a changed label", () => {
    const host = mount();
    host.setAttribute("label", "Alignment");
    expect(screen.getByRole("group", { name: "Alignment" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    mount();
    expect(await axe(document.body, noAxeColorContrast)).toHaveNoViolations();
  });
});
