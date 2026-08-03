import { render, screen, within } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { nextTick } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { SearchDialog } from "./SearchDialog";
import type { SearchDialogItem } from "./use-search-dialog";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const items: SearchDialogItem[] = [
  { value: "new-file", label: "New File" },
  { value: "open", label: "Open…" },
  { value: "save", label: "Save" },
  { value: "settings", label: "Settings" },
];

const setup = (props: Record<string, unknown> = {}) =>
  render(SearchDialog, {
    props: { items, ...props },
    slots: { trigger: () => "Open palette" },
  });

const openPalette = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Open palette" }));

const groupedItems: SearchDialogItem[] = [
  { value: "home", label: "Home", group: "Pages" },
  { value: "settings-page", label: "Settings page", group: "Pages" },
  { value: "new", label: "New File", group: "Actions" },
  { value: "save", label: "Save", group: "Actions" },
  { value: "help", label: "Help" },
];

describe("Vue SearchDialog", () => {
  it("is closed by default", () => {
    setup();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens a modal palette with the search input focused", async () => {
    const user = userEvent.setup();
    setup();

    await openPalette(user);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("combobox")).toHaveFocus();
    expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(4);
  });

  it("opens and closes when the open prop changes", async () => {
    const { rerender } = setup({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await rerender({ items, open: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await rerender({ items, open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("updates visible results when items change", async () => {
    const { rerender } = setup({ open: true, items: [{ value: "save", label: "Save" }] });
    // `showModal()` runs in a post-flush effect, so the panel becomes visible
    // to role queries on the next tick.
    await nextTick();
    expect(
      within(screen.getByRole("listbox")).getByRole("option", { name: "Save" }),
    ).toBeInTheDocument();

    await rerender({ open: true, items: [{ value: "deploy", label: "Deploy" }] });
    expect(screen.queryByRole("option", { name: "Save" })).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("listbox")).getByRole("option", { name: "Deploy" }),
    ).toBeInTheDocument();
  });

  it("filters results as you type", async () => {
    const user = userEvent.setup();
    setup();
    await openPalette(user);

    await user.type(screen.getByRole("combobox"), "sa");
    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Save");
  });

  it("selects a result on click and closes", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    setup({ onSelect });
    await openPalette(user);

    await user.click(within(screen.getByRole("listbox")).getByRole("option", { name: "Save" }));
    expect(onSelect).toHaveBeenCalledWith("save");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("selects the active result with the keyboard", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    setup({ onSelect });
    await openPalette(user);

    // Nothing is pre-highlighted on open; the first ArrowDown lands on the
    // first item, a second moves to "Open…".
    await user.keyboard("{ArrowDown}"); // -> New File
    await user.keyboard("{ArrowDown}"); // -> Open…
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("open");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    setup();
    await openPalette(user);
    await user.type(screen.getByRole("combobox"), "zzz");
    // The visible message (the status region announces the same text).
    expect(screen.getByText("No results found.", { selector: "p" })).toBeInTheDocument();
    // The empty message stays out of the listbox, so it is no fake option.
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("announces the filtered result count via a status region", async () => {
    const user = userEvent.setup();
    setup();
    await openPalette(user);

    expect(screen.getByRole("status")).toHaveTextContent("4 results available");
    await user.type(screen.getByRole("combobox"), "sa");
    expect(screen.getByRole("status")).toHaveTextContent("1 result available");
    await user.type(screen.getByRole("combobox"), "zzz");
    expect(screen.getByRole("status")).toHaveTextContent("No results found.");
  });

  it("renders grouped results under labelled sections, ungrouped first", async () => {
    const user = userEvent.setup();
    setup({ items: groupedItems });
    await openPalette(user);

    const groups = screen.getAllByRole("group");
    expect(groups).toHaveLength(2);
    expect(groups[0]).toHaveAccessibleName("Pages");
    expect(groups[1]).toHaveAccessibleName("Actions");
    expect(within(groups[0]).getAllByRole("option")).toHaveLength(2);
    // Ungrouped items come first in the flat traversal order.
    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options[0]).toHaveTextContent("Help");
    expect(options).toHaveLength(5);
  });

  it("keyboard traversal crosses group boundaries in display order", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    setup({ items: groupedItems, onSelect });
    await openPalette(user);

    // Help (ungrouped) -> Home -> Settings page (both in Pages)
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("settings-page");
  });

  it("hides a group and its header when the filter empties it", async () => {
    const user = userEvent.setup();
    setup({ items: groupedItems });
    await openPalette(user);

    await user.type(screen.getByRole("combobox"), "sett");
    const groups = screen.getAllByRole("group");
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveAccessibleName("Pages");
    expect(screen.queryByText("Actions")).not.toBeInTheDocument();
  });

  it("shows suggestions while the query is empty, results once typing", async () => {
    const user = userEvent.setup();
    setup({ suggestions: [{ value: "open", label: "Open…", group: "Recent" }] });
    await openPalette(user);

    // Empty query: only the suggestion, under its "Recent" group.
    expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("group")).toHaveAccessibleName("Recent");

    // Typing swaps to filtered results; clearing brings the suggestions back.
    await user.type(screen.getByRole("combobox"), "sa");
    expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(1);
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    await user.clear(screen.getByRole("combobox"));
    expect(screen.getByRole("group")).toHaveAccessibleName("Recent");
  });

  it("announces and shows the loading state, holding back the empty state", async () => {
    const user = userEvent.setup();
    setup({ items: [], loading: true });
    await openPalette(user);

    expect(screen.getByRole("status")).toHaveTextContent("Searching…");
    expect(screen.queryByText("No results found.")).not.toBeInTheDocument();
  });

  it("renders an item shortcut as a keycap label inside the option", async () => {
    const user = userEvent.setup();
    setup({
      items: [
        { value: "save", label: "Save", shortcut: ["⌘", "S"] },
        { value: "open", label: "Open…" },
      ],
    });
    await openPalette(user);

    const option = screen.getByRole("option", { name: /Save/ });
    const kbd = option.querySelector("kbd");
    expect(kbd).not.toBeNull();
    expect(kbd!.textContent).toContain("⌘");
    // A label, not a control: nothing focusable inside the option.
    expect(option.querySelector("button, a, input")).toBeNull();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    setup();
    await openPalette(user);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("reports the open state through v-model", async () => {
    const user = userEvent.setup();
    const { emitted } = setup();
    await openPalette(user);
    expect(emitted()["update:open"]).toEqual([[true]]);
  });

  it("has no accessibility violations with grouped results", async () => {
    const user = userEvent.setup();
    setup({ items: groupedItems });
    await openPalette(user);
    expect(await axe(document.body, noAxeColorContrast)).toHaveNoViolations();
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    setup();
    await openPalette(user);
    expect(await axe(document.body, noAxeColorContrast)).toHaveNoViolations();
  });
});
