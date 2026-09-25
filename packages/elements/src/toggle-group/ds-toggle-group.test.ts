import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const mount = (attrs = "") => {
  document.body.innerHTML = `<ds-toggle-group ${attrs}>
    <ds-toggle-button label="List">List</ds-toggle-button>
    <ds-toggle-button label="Board">Board</ds-toggle-button>
    <ds-toggle-button label="Calendar">Calendar</ds-toggle-button>
  </ds-toggle-group>`;
  return document.querySelector("ds-toggle-group")!;
};

describe("<ds-toggle-group>", () => {
  it("is a role=group carrying the optional container name", () => {
    mount('label="View"');
    expect(screen.getByRole("group", { name: "View" })).toBeInTheDocument();
  });

  it("renders the inserted toggles, each an independent checkbox", () => {
    mount();
    for (const name of ["List", "Board", "Calendar"]) {
      expect(screen.getByRole("group")).toContainElement(screen.getByRole("checkbox", { name }));
    }
  });

  it("toggles each child independently", async () => {
    const user = userEvent.setup();
    mount();
    const list = screen.getByRole("checkbox", { name: "List" });
    const board = screen.getByRole("checkbox", { name: "Board" });

    await user.click(list);
    await user.click(board);
    expect(list).toBeChecked();
    expect(board).toBeChecked();
  });

  it("keeps each toggle its own tab stop", async () => {
    const user = userEvent.setup();
    mount();
    await user.tab();
    expect(screen.getByRole("checkbox", { name: "List" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("checkbox", { name: "Board" })).toHaveFocus();
  });

  it("lays the toggles out as siblings, so a segmented group draws its dividers", () => {
    mount('variant="segmented"');
    const group = screen.getByRole("group");
    expect(group).toHaveClass("toggle-group", "toggle-group--segmented");
    expect(group).toHaveAttribute("data-orientation", "horizontal");
    // The divider rule matches `.toggle:not(:first-child)` inside the group.
    expect(group.querySelectorAll(".toggle:not(:first-child)")).toHaveLength(2);
  });

  it("follows its attributes after mount", () => {
    const host = mount();
    const group = screen.getByRole("group");

    host.setAttribute("wrap", "");
    expect(group).toHaveClass("toggle-group--wrap");
    host.setAttribute("variant", "segmented");
    expect(group).not.toHaveClass("toggle-group--wrap");
    host.setAttribute("orientation", "vertical");
    expect(group).toHaveAttribute("data-orientation", "vertical");
    host.setAttribute("label", "Layout");
    expect(screen.getByRole("group", { name: "Layout" })).toBe(group);
  });

  it("has no accessibility violations", async () => {
    mount('label="View"');
    expect(await axe(document.body, noAxeColorContrast)).toHaveNoViolations();
  });
});
