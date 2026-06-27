import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./command.fixture.svelte";

const openPalette = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Open palette" }));

describe("Svelte Command (styled)", () => {
  it("is closed by default", () => {
    render(Fixture);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens a modal palette with the search input focused", async () => {
    const user = userEvent.setup();
    render(Fixture);

    await openPalette(user);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    const input = screen.getByRole("combobox");
    expect(input).toHaveFocus();
    expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(4);
  });

  it("filters commands as you type", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await openPalette(user);

    await user.type(screen.getByRole("combobox"), "sa");
    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Save");
  });

  it("runs a command on click and closes", async () => {
    const user = userEvent.setup();
    const onCommand = vi.fn();
    render(Fixture, { props: { onCommand } });
    await openPalette(user);

    await user.click(within(screen.getByRole("listbox")).getByRole("option", { name: "Save" }));
    expect(onCommand).toHaveBeenCalledWith("save");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("runs the active command with the keyboard", async () => {
    const user = userEvent.setup();
    const onCommand = vi.fn();
    render(Fixture, { props: { onCommand } });
    await openPalette(user);

    // Nothing is pre-highlighted on open; first ArrowDown lands on the first
    // item, a second moves to "Open…".
    await user.keyboard("{ArrowDown}"); // -> New File
    await user.keyboard("{ArrowDown}"); // -> Open…
    await user.keyboard("{Enter}");
    expect(onCommand).toHaveBeenCalledWith("open");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await openPalette(user);
    await user.type(screen.getByRole("combobox"), "zzz");
    expect(screen.getByText("No results found.")).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await openPalette(user);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await openPalette(user);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
