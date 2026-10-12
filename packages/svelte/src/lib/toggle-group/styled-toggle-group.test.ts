import { render, screen, waitFor } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./styled-toggle-group.fixture.svelte";
import KeysFixture from "./toggle-group-keys.fixture.svelte";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const toggle = (name: string) => screen.getByRole("button", { name });

describe("Svelte ToggleGroup", () => {
  it("is a role=group carrying the optional container name", () => {
    render(Fixture, { props: { label: "View" } });
    expect(screen.getByRole("group", { name: "View" })).toBeInTheDocument();
  });

  it("renders the inserted toggles, each an independent toggle button", () => {
    render(Fixture);
    expect(screen.getByRole("button", { name: "List", pressed: false })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Board", pressed: false })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Calendar", pressed: false })).toBeInTheDocument();
  });

  it("toggles each child independently (no shared selection)", async () => {
    const user = userEvent.setup();
    render(Fixture);

    await user.click(toggle("List"));
    await user.click(toggle("Board"));
    // Both stay on: the group imposes no single selection.
    expect(toggle("List")).toHaveAttribute("aria-pressed", "true");
    expect(toggle("Board")).toHaveAttribute("aria-pressed", "true");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { label: "View" } });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});

describe("Svelte ToggleGroup (three or more toggles: one tab stop)", () => {
  const tabIndexes = () =>
    ["List", "Board", "Calendar"].map((name) => toggle(name).getAttribute("tabindex"));

  it("has exactly one tab stop", () => {
    render(KeysFixture);
    expect(tabIndexes()).toEqual(["0", "-1", "-1"]);
  });

  it("moves with the arrow keys, wrapping, and with Home and End", async () => {
    const user = userEvent.setup();
    render(KeysFixture);
    toggle("List").focus();

    await user.keyboard("{ArrowRight}");
    expect(toggle("Board")).toHaveFocus();
    expect(tabIndexes()).toEqual(["-1", "0", "-1"]);
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(toggle("List")).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(toggle("Calendar")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(toggle("List")).toHaveFocus();
    await user.keyboard("{End}");
    expect(toggle("Calendar")).toHaveFocus();
  });

  it("enters the Tab order once and returns to the toggle focused last", async () => {
    const user = userEvent.setup();
    render(KeysFixture);
    screen.getByRole("button", { name: "Before" }).focus();

    await user.tab();
    expect(toggle("List")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    await user.tab();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(toggle("Board")).toHaveFocus();
  });

  it("mirrors Left and Right in right-to-left text", async () => {
    const user = userEvent.setup();
    render(KeysFixture);
    screen.getByRole("group", { name: "View" }).setAttribute("dir", "rtl");
    toggle("List").focus();

    await user.keyboard("{ArrowLeft}");
    expect(toggle("Board")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(toggle("List")).toHaveFocus();
  });

  it("uses Up and Down when vertical", async () => {
    const user = userEvent.setup();
    render(KeysFixture, { props: { orientation: "vertical" } });
    toggle("List").focus();

    await user.keyboard("{ArrowRight}");
    expect(toggle("List")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(toggle("Board")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(toggle("List")).toHaveFocus();
  });

  it("skips disabled toggles", async () => {
    const user = userEvent.setup();
    render(KeysFixture, { props: { disabled: ["Board"] } });
    toggle("List").focus();

    await user.keyboard("{ArrowRight}");
    expect(toggle("Calendar")).toHaveFocus();
  });

  it("never changes a toggle when moving focus", async () => {
    const user = userEvent.setup();
    render(KeysFixture);
    toggle("List").focus();

    await user.keyboard("{ArrowRight}{ArrowRight}{Home}{End}");
    for (const name of ["List", "Board", "Calendar"]) {
      expect(toggle(name)).toHaveAttribute("aria-pressed", "false");
    }
  });
});

describe("Svelte ToggleGroup (one or two toggles: own tab stops)", () => {
  it("sets no tabindex and handles no arrows", async () => {
    const user = userEvent.setup();
    render(KeysFixture, { props: { items: ["List", "Board"] } });
    expect(toggle("List")).not.toHaveAttribute("tabindex");
    expect(toggle("Board")).not.toHaveAttribute("tabindex");

    toggle("List").focus();
    await user.keyboard("{ArrowRight}");
    expect(toggle("List")).toHaveFocus();
    await user.tab();
    expect(toggle("Board")).toHaveFocus();
  });
});

describe("Svelte ToggleGroup (inside a toolbar)", () => {
  it("adds nothing: the toolbar's roving reaches the toggles", async () => {
    const user = userEvent.setup();
    render(KeysFixture, { props: { inToolbar: true } });
    expect(screen.getByRole("button", { name: "Undo" })).toHaveAttribute("tabindex", "0");
    for (const name of ["List", "Board", "Calendar"]) {
      expect(toggle(name)).toHaveAttribute("tabindex", "-1");
    }

    screen.getByRole("button", { name: "Undo" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(toggle("List")).toHaveFocus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(toggle("Calendar")).toHaveFocus();
    // The toolbar wraps over all its controls, back to Undo.
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Undo" })).toHaveFocus();
  });
});

describe("Svelte ToggleGroup (toggles added or removed)", () => {
  it("moves focus to the neighbour when the focused toggle is removed", async () => {
    const { rerender } = render(KeysFixture, {
      props: { items: ["List", "Board", "Calendar", "Table"] },
    });
    toggle("Board").focus();

    await rerender({ items: ["List", "Calendar", "Table"] });
    await waitFor(() => expect(toggle("Calendar")).toHaveFocus());
    expect(toggle("Calendar")).toHaveAttribute("tabindex", "0");
  });

  it("does not pull focus back once the user has left the group", async () => {
    const { rerender } = render(KeysFixture, {
      props: { items: ["List", "Board", "Calendar", "Table"] },
    });
    toggle("Board").focus();
    toggle("Board").blur();
    await Promise.resolve();

    await rerender({ items: ["List", "Calendar", "Table"] });
    await waitFor(() => expect(toggle("Calendar")).toHaveAttribute("tabindex", "0"));
    expect(document.body).toHaveFocus();
  });

  it("keeps focus where it is when a toggle is added", async () => {
    const { rerender } = render(KeysFixture);
    toggle("Board").focus();

    await rerender({ items: ["List", "Board", "Calendar", "Table"] });
    await waitFor(() => expect(toggle("Table")).toHaveAttribute("tabindex", "-1"));
    expect(toggle("Board")).toHaveFocus();
    expect(toggle("Board")).toHaveAttribute("tabindex", "0");
  });

  it("gives each toggle its own tab stop when going from three to two", async () => {
    const { rerender } = render(KeysFixture);
    await rerender({ items: ["List", "Board"] });

    await waitFor(() => expect(toggle("List")).not.toHaveAttribute("tabindex"));
    expect(toggle("Board")).not.toHaveAttribute("tabindex");
  });

  it("makes one tab stop when going from two to three", async () => {
    const { rerender } = render(KeysFixture, { props: { items: ["List", "Board"] } });
    await rerender({ items: ["List", "Board", "Calendar"] });

    await waitFor(() => expect(toggle("Calendar")).toHaveAttribute("tabindex", "-1"));
    expect(toggle("List")).toHaveAttribute("tabindex", "0");
    expect(toggle("Board")).toHaveAttribute("tabindex", "-1");
  });
});
