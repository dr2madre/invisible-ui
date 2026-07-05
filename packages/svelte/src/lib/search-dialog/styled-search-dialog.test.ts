import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./search-dialog.fixture.svelte";

const openPalette = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Open palette" }));

describe("Svelte SearchDialog (styled)", () => {
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

  it("opens and closes when the open prop changes", async () => {
    const { rerender } = render(Fixture, { props: { open: false } });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await rerender({ open: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await rerender({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("updates visible commands when items change", async () => {
    const { rerender } = render(Fixture, {
      props: {
        open: true,
        items: [{ value: "save", label: "Save" }],
      },
    });
    expect(
      within(screen.getByRole("listbox")).getByRole("option", { name: "Save" }),
    ).toBeInTheDocument();

    await rerender({
      open: true,
      items: [{ value: "deploy", label: "Deploy" }],
    });
    expect(screen.queryByRole("option", { name: "Save" })).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("listbox")).getByRole("option", { name: "Deploy" }),
    ).toBeInTheDocument();
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

  it("selects a result on click and closes", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(Fixture, { props: { onSelect } });
    await openPalette(user);

    await user.click(within(screen.getByRole("listbox")).getByRole("option", { name: "Save" }));
    expect(onSelect).toHaveBeenCalledWith("save");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("selects the active result with the keyboard", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(Fixture, { props: { onSelect } });
    await openPalette(user);

    // Nothing is pre-highlighted on open; first ArrowDown lands on the first
    // item, a second moves to "Open…".
    await user.keyboard("{ArrowDown}"); // -> New File
    await user.keyboard("{ArrowDown}"); // -> Open…
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("open");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await openPalette(user);
    await user.type(screen.getByRole("combobox"), "zzz");
    // The visible message (the status region announces the same text).
    expect(screen.getByText("No results found.", { selector: "p" })).toBeInTheDocument();
    // The empty message is not a fake option inside the listbox.
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("announces the filtered result count via a status region", async () => {
    const user = userEvent.setup();
    render(Fixture);
    await openPalette(user);

    expect(screen.getByRole("status")).toHaveTextContent("4 results available");
    await user.type(screen.getByRole("combobox"), "sa");
    expect(screen.getByRole("status")).toHaveTextContent("1 result available");
    await user.type(screen.getByRole("combobox"), "zzz");
    expect(screen.getByRole("status")).toHaveTextContent("No results found.");
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
