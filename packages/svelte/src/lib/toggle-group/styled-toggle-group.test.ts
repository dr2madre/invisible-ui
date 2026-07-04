import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./styled-toggle-group.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

describe("Svelte ToggleGroup (visual wrapper)", () => {
  it("is a role=group carrying the optional container name", () => {
    render(Fixture, { props: { label: "View" } });
    expect(screen.getByRole("group", { name: "View" })).toBeInTheDocument();
  });

  it("renders the inserted toggles, each an independent checkbox", () => {
    render(Fixture);
    expect(screen.getByRole("checkbox", { name: "List" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Board" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Calendar" })).toBeInTheDocument();
  });

  it("toggles each child independently (no shared selection)", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const list = screen.getByRole("checkbox", { name: "List" });
    const board = screen.getByRole("checkbox", { name: "Board" });

    await user.click(list);
    await user.click(board);
    // Both stay on — the group imposes no single-selection.
    expect(list).toBeChecked();
    expect(board).toBeChecked();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { label: "View" } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
