import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, type ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import type { DialogHandle } from "../dialog/use-dialog-handle";
import { LocaleProvider } from "../i18n/i18n";
import { SearchDialog } from "./SearchDialog";

const ITEMS = [
  { value: "new-file", label: "New File" },
  { value: "open", label: "Open…" },
  { value: "save", label: "Save" },
  { value: "settings", label: "Settings" },
];

const Search = (props: Partial<ComponentProps<typeof SearchDialog>>) => (
  <SearchDialog items={ITEMS} trigger={<span>Open palette</span>} {...props} />
);

const openPalette = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Open palette" }));

// The results count region; the dialog's status area holds another one.
const resultsStatus = () =>
  document.querySelector<HTMLElement>(".search-dialog__sr-only[role='status']");

const groupedItems = [
  { value: "home", label: "Home", group: "Pages" },
  { value: "settings-page", label: "Settings page", group: "Pages" },
  { value: "new", label: "New File", group: "Actions" },
  { value: "save", label: "Save", group: "Actions" },
  { value: "help", label: "Help" },
];

describe("React SearchDialog (styled)", () => {
  it("is closed by default", () => {
    render(<Search />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens a modal palette with the search input focused", async () => {
    const user = userEvent.setup();
    render(<Search />);

    await openPalette(user);
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("dialog")).toHaveAccessibleName("Search");
    expect(screen.getByRole("combobox")).toHaveFocus();
    expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(4);
  });

  it("opens and closes when the open prop changes, without reporting it", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(<Search open={false} onOpenChange={onOpenChange} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(<Search open onOpenChange={onOpenChange} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    rerender(<Search open={false} onOpenChange={onOpenChange} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("updates visible results when items change", () => {
    const { rerender } = render(<Search open items={[{ value: "save", label: "Save" }]} />);
    expect(
      within(screen.getByRole("listbox")).getByRole("option", { name: "Save" }),
    ).toBeInTheDocument();

    rerender(<Search open items={[{ value: "deploy", label: "Deploy" }]} />);
    expect(screen.queryByRole("option", { name: "Save" })).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("listbox")).getByRole("option", { name: "Deploy" }),
    ).toBeInTheDocument();
  });

  it("filters results as you type", async () => {
    const user = userEvent.setup();
    render(<Search />);
    await openPalette(user);

    await user.type(screen.getByRole("combobox"), "sa");
    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Save");
  });

  it("keeps the query when focus leaves the input", async () => {
    const user = userEvent.setup();
    render(<Search />);
    await openPalette(user);

    const query = screen.getByRole("combobox");
    await user.type(query, "sa");
    // The query is what the user wrote, not the label of a selection.
    fireEvent.blur(query);
    expect(query).toHaveValue("sa");
    expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(1);
  });

  it("selects a result on click and closes", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Search onSelect={onSelect} />);
    await openPalette(user);

    await user.click(within(screen.getByRole("listbox")).getByRole("option", { name: "Save" }));
    expect(onSelect).toHaveBeenCalledWith("save");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("selects the active result with the keyboard", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(<Search onSelect={onSelect} onOpenChange={onOpenChange} />);
    await openPalette(user);

    // Nothing is highlighted on open; the first ArrowDown lands on the first
    // result, a second moves to "Open…".
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Open…" }).id,
    );
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("open");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  it("highlights the first match while typing, so Enter runs it", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Search onSelect={onSelect} />);
    await openPalette(user);

    await user.type(screen.getByRole("combobox"), "set{Enter}");
    expect(onSelect).toHaveBeenCalledWith("settings");
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    render(<Search />);
    await openPalette(user);
    await user.type(screen.getByRole("combobox"), "zzz");
    expect(screen.getByText("No results found.", { selector: "p" })).toBeInTheDocument();
    // The empty message is not a fake option inside the listbox.
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("announces the filtered result count via a status region", async () => {
    const user = userEvent.setup();
    render(<Search />);
    await openPalette(user);

    expect(resultsStatus()).toHaveTextContent("4 results available");
    await user.type(screen.getByRole("combobox"), "sa");
    expect(resultsStatus()).toHaveTextContent("1 result available");
    await user.type(screen.getByRole("combobox"), "zzz");
    expect(resultsStatus()).toHaveTextContent("No results found.");
  });

  it("renders grouped results under labelled sections, ungrouped first", async () => {
    const user = userEvent.setup();
    render(<Search items={groupedItems} />);
    await openPalette(user);

    const groups = screen.getAllByRole("group");
    expect(groups).toHaveLength(2);
    expect(groups[0]).toHaveAccessibleName("Pages");
    expect(groups[1]).toHaveAccessibleName("Actions");
    expect(within(groups[0]!).getAllByRole("option")).toHaveLength(2);
    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options[0]).toHaveTextContent("Help");
    expect(options).toHaveLength(5);
  });

  it("keyboard traversal crosses group boundaries in display order", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Search items={groupedItems} onSelect={onSelect} />);
    await openPalette(user);

    // Help (ungrouped), then Home and Settings page (both in Pages).
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith("settings-page");
  });

  it("hides a group and its header when the filter empties it", async () => {
    const user = userEvent.setup();
    render(<Search items={groupedItems} />);
    await openPalette(user);

    await user.type(screen.getByRole("combobox"), "sett");
    const groups = screen.getAllByRole("group");
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveAccessibleName("Pages");
    expect(screen.queryByText("Actions")).not.toBeInTheDocument();
  });

  it("has no accessibility violations with grouped results", async () => {
    const user = userEvent.setup();
    render(<Search items={groupedItems} />);
    await openPalette(user);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("shows suggestions while the query is empty, results once typing", async () => {
    const user = userEvent.setup();
    render(<Search suggestions={[{ value: "open", label: "Open…", group: "Recent" }]} />);
    await openPalette(user);

    expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("group")).toHaveAccessibleName("Recent");

    await user.type(screen.getByRole("combobox"), "sa");
    expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(1);
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    await user.clear(screen.getByRole("combobox"));
    expect(screen.getByRole("group")).toHaveAccessibleName("Recent");
  });

  it("announces and shows the loading state, holding back the empty state", async () => {
    const user = userEvent.setup();
    render(<Search items={[]} loading />);
    await openPalette(user);

    expect(resultsStatus()).toHaveTextContent("Searching…");
    expect(document.querySelector(".search-dialog__loading .loading")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(screen.queryByText("No results found.")).not.toBeInTheDocument();
  });

  it("renders an item shortcut as a keycap label inside the option", async () => {
    const user = userEvent.setup();
    render(
      <Search
        items={[
          { value: "save", label: "Save", shortcut: ["⌘", "S"] },
          { value: "open", label: "Open…", shortcut: "⌘O" },
        ]}
      />,
    );
    await openPalette(user);

    const option = screen.getByRole("option", { name: /Save/ });
    const kbd = option.querySelector("kbd.kbd--chord");
    expect(kbd).not.toBeNull();
    expect(kbd!.querySelectorAll("kbd.kbd__key")).toHaveLength(2);
    expect(kbd!.textContent).toContain("⌘");
    // A label, not a control: nothing focusable inside the option.
    expect(option.querySelector("button, a, input")).toBeNull();
    expect(screen.getByRole("option", { name: /Open/ }).querySelector("kbd")).toHaveTextContent(
      "⌘O",
    );
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Search onOpenChange={onOpenChange} />);
    await openPalette(user);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open palette" })).toHaveFocus();
    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
  });

  it("starts each opening from a blank query", async () => {
    const user = userEvent.setup();
    render(<Search />);
    await openPalette(user);
    await user.type(screen.getByRole("combobox"), "sa");
    await user.keyboard("{Escape}");

    await openPalette(user);
    expect(screen.getByRole("combobox")).toHaveValue("");
    expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(4);
  });

  it("takes its texts from the catalog", async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider
        locale="it"
        messages={{
          "searchDialog.placeholder": "Cerca…",
          "searchDialog.empty": "Nessun risultato.",
        }}
      >
        <Search />
      </LocaleProvider>,
    );
    await openPalette(user);
    expect(screen.getByRole("combobox")).toHaveAttribute("placeholder", "Cerca…");
    await user.type(screen.getByRole("combobox"), "zzz");
    expect(screen.getByText("Nessun risultato.", { selector: "p" })).toBeInTheDocument();
  });

  it("holds the status area on its ref (ADR 0016)", async () => {
    const user = userEvent.setup();
    const ref = createRef<DialogHandle>();
    render(<Search ref={ref} />);
    await openPalette(user);

    act(() => {
      ref.current?.notify({ status: "danger", title: "The index is out of date" });
    });
    expect(screen.getByRole("group", { name: "The index is out of date" })).toBeInTheDocument();
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    render(<Search />);
    await openPalette(user);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
