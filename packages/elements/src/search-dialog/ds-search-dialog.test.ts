import { fireEvent, screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsSearchDialog, SearchDialogItem } from "./ds-search-dialog";

const ITEMS: SearchDialogItem[] = [
  { value: "new-file", label: "New File" },
  { value: "open", label: "Open…" },
  { value: "save", label: "Save" },
  { value: "settings", label: "Settings" },
];

const mount = (items: SearchDialogItem[] = ITEMS, attributes = "") => {
  document.body.innerHTML = `<ds-search-dialog trigger="Open palette" ${attributes}></ds-search-dialog>`;
  const host = document.querySelector("ds-search-dialog") as DsSearchDialog;
  host.items = items;
  const onSelect = vi.fn();
  host.addEventListener("select", (e) => onSelect((e as CustomEvent).detail));
  return { host, onSelect };
};

const openPalette = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Open palette" }));
const options = () => within(screen.getByRole("listbox")).queryAllByRole("option");

describe("<ds-search-dialog>", () => {
  it("is closed by default", () => {
    mount();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens a modal palette with the search input focused", async () => {
    const user = userEvent.setup();
    mount();
    await openPalette(user);
    const dialog = screen.getByRole("dialog", { name: "Search" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("combobox", { name: "Search" })).toHaveFocus();
    expect(options()).toHaveLength(4);
  });

  it("names the dialog with a visually hidden title by default", async () => {
    const user = userEvent.setup();
    const { host } = mount();
    await openPalette(user);
    const title = document.querySelector(".dialog-header__title")!;
    expect(title).toHaveClass("dialog-header__title--hidden");
    expect(document.querySelector(".dialog-header")).toHaveClass("dialog-header--empty");
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();

    host.setAttribute("hide-title", "false");
    host.setAttribute("close-button", "");
    expect(title).not.toHaveClass("dialog-header__title--hidden");
    expect(document.querySelector(".dialog-header")).not.toHaveClass("dialog-header--empty");
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens and closes when the open attribute changes", () => {
    const { host } = mount();
    host.setAttribute("open", "");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    host.removeAttribute("open");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("updates the visible results when items change", () => {
    const { host } = mount([{ value: "save", label: "Save" }]);
    host.open = true;
    expect(screen.getByRole("option", { name: "Save" })).toBeInTheDocument();
    host.items = [{ value: "deploy", label: "Deploy" }];
    expect(screen.queryByRole("option", { name: "Save" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Deploy" })).toBeInTheDocument();
  });

  it("accepts items assigned before the element upgraded", () => {
    document.body.innerHTML = "";
    const host = document.createElement("ds-search-dialog") as DsSearchDialog;
    host.items = [{ value: "save", label: "Save" }];
    host.setAttribute("open", "");
    document.body.append(host);
    expect(screen.getByRole("option", { name: "Save" })).toBeInTheDocument();
  });

  it("filters results as you type", async () => {
    const user = userEvent.setup();
    mount();
    await openPalette(user);
    await user.type(screen.getByRole("combobox"), "sa");
    expect(options()).toHaveLength(1);
    expect(options()[0]).toHaveTextContent("Save");
  });

  it("keeps the query when focus leaves the input", async () => {
    const user = userEvent.setup();
    mount();
    await openPalette(user);
    const query = screen.getByRole("combobox") as HTMLInputElement;
    await user.type(query, "sa");
    fireEvent.blur(query);
    expect(query.value).toBe("sa");
    expect(options()).toHaveLength(1);
  });

  it("selects a result on click and closes", async () => {
    const user = userEvent.setup();
    const { onSelect } = mount();
    const trigger = screen.getByRole("button", { name: "Open palette" });
    await openPalette(user);
    await user.click(screen.getByRole("option", { name: "Save" }));
    expect(onSelect).toHaveBeenCalledWith({ value: "save" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("selects the active result with the keyboard", async () => {
    const user = userEvent.setup();
    const { onSelect } = mount();
    await openPalette(user);
    // Nothing is highlighted on open: the first ArrowDown lands on New File.
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: "Open…" }).id,
    );
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith({ value: "open" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("typing highlights the first match, so Enter runs it", async () => {
    const user = userEvent.setup();
    const { onSelect } = mount();
    await openPalette(user);
    await user.type(screen.getByRole("combobox"), "set{Enter}");
    expect(onSelect).toHaveBeenCalledWith({ value: "settings" });
  });

  it("does not report native text selection in the input as a choice", async () => {
    const user = userEvent.setup();
    const { onSelect } = mount();
    await openPalette(user);
    fireEvent.select(screen.getByRole("combobox"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows an empty state outside the listbox when nothing matches", async () => {
    const user = userEvent.setup();
    mount();
    await openPalette(user);
    await user.type(screen.getByRole("combobox"), "zzz");
    expect(screen.getByText("No results found.", { selector: "p" })).toBeInTheDocument();
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("announces the filtered result count via a status region", async () => {
    const user = userEvent.setup();
    mount();
    await openPalette(user);
    expect(screen.getByRole("status")).toHaveTextContent("4 results available");
    await user.type(screen.getByRole("combobox"), "sa");
    expect(screen.getByRole("status")).toHaveTextContent("1 result available");
    await user.type(screen.getByRole("combobox"), "zzz");
    expect(screen.getByRole("status")).toHaveTextContent("No results found.");
  });

  const grouped: SearchDialogItem[] = [
    { value: "home", label: "Home", group: "Pages" },
    { value: "settings-page", label: "Settings page", group: "Pages" },
    { value: "new", label: "New File", group: "Actions" },
    { value: "save", label: "Save", group: "Actions" },
    { value: "help", label: "Help" },
  ];

  it("renders grouped results under labelled sections, ungrouped first", async () => {
    const user = userEvent.setup();
    mount(grouped);
    await openPalette(user);
    const groups = screen.getAllByRole("group");
    expect(groups).toHaveLength(2);
    expect(groups[0]).toHaveAccessibleName("Pages");
    expect(groups[1]).toHaveAccessibleName("Actions");
    expect(within(groups[0]!).getAllByRole("option")).toHaveLength(2);
    expect(options()[0]).toHaveTextContent("Help");
    expect(options()).toHaveLength(5);
  });

  it("keyboard traversal crosses group boundaries in display order", async () => {
    const user = userEvent.setup();
    const { onSelect } = mount(grouped);
    await openPalette(user);
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith({ value: "settings-page" });
  });

  it("hides a group and its header when the filter empties it", async () => {
    const user = userEvent.setup();
    mount(grouped);
    await openPalette(user);
    await user.type(screen.getByRole("combobox"), "sett");
    const groups = screen.getAllByRole("group");
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveAccessibleName("Pages");
    expect(screen.queryByText("Actions")).not.toBeInTheDocument();
  });

  it("shows suggestions while the query is empty, results once typing", async () => {
    const user = userEvent.setup();
    const { host } = mount();
    host.suggestions = [{ value: "open", label: "Open…", group: "Recent" }];
    await openPalette(user);
    expect(options()).toHaveLength(1);
    expect(screen.getByRole("group")).toHaveAccessibleName("Recent");

    await user.type(screen.getByRole("combobox"), "sa");
    expect(options()).toHaveLength(1);
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    await user.clear(screen.getByRole("combobox"));
    expect(screen.getByRole("group")).toHaveAccessibleName("Recent");
  });

  it("announces and shows the loading state, suppressing the empty state", async () => {
    const user = userEvent.setup();
    mount([], "loading");
    await openPalette(user);
    expect(screen.getByRole("status")).toHaveTextContent("Searching…");
    expect(document.querySelector(".search-dialog__loading")).not.toBeNull();
    expect(screen.queryByText("No results found.", { selector: "p" })).not.toBeInTheDocument();
  });

  it("renders an item shortcut as a keycap label inside the option", async () => {
    const user = userEvent.setup();
    mount([
      { value: "save", label: "Save", shortcut: ["⌘", "S"] },
      { value: "open", label: "Open…", shortcut: "⌘O" },
    ]);
    await openPalette(user);
    const option = screen.getByRole("option", { name: /Save/ });
    const kbd = option.querySelector("kbd");
    expect(kbd).not.toBeNull();
    expect(kbd!.textContent).toContain("⌘");
    expect(option.querySelector("button, a, input")).toBeNull();
    expect(screen.getByRole("option", { name: /Open/ }).querySelector("kbd")).toHaveTextContent(
      "⌘O",
    );
  });

  it("starts each opening from a blank query", async () => {
    const user = userEvent.setup();
    mount();
    await openPalette(user);
    await user.type(screen.getByRole("combobox"), "sa");
    await user.keyboard("{Escape}");
    await openPalette(user);
    expect(screen.getByRole("combobox")).toHaveValue("");
    expect(options()).toHaveLength(4);
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    mount();
    const trigger = screen.getByRole("button", { name: "Open palette" });
    await openPalette(user);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    mount();
    await openPalette(user);
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("has no accessibility violations with grouped results", async () => {
    const user = userEvent.setup();
    mount(grouped);
    await openPalette(user);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
