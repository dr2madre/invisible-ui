import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsDropdownMenu, MenuEntry } from "./ds-dropdown-menu";

const ITEMS: MenuEntry[] = [
  { value: "new", label: "New file" },
  { value: "open", label: "Open" },
  { value: "rename", label: "Rename", disabled: true },
  { value: "delete", label: "Delete" },
];

const mount = (items: MenuEntry[] = ITEMS, attributes = "") => {
  document.body.innerHTML = `<ds-dropdown-menu label="Actions" ${attributes}></ds-dropdown-menu>`;
  const host = document.querySelector("ds-dropdown-menu") as DsDropdownMenu;
  host.items = items;
  const onSelect = vi.fn();
  host.addEventListener("select", (event) => onSelect((event as CustomEvent).detail.value));
  return { host, onSelect };
};
const trigger = () => screen.getByRole("button", { name: "Actions" });

describe("<ds-dropdown-menu>", () => {
  it("renders a closed menu button", () => {
    mount();
    expect(trigger()).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens on click and exposes the menu items", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(trigger());
    expect(screen.getByRole("menu")).toBeVisible();
    expect(screen.getAllByRole("menuitem")).toHaveLength(4);
    expect(screen.getByRole("menuitem", { name: "New file" })).toHaveFocus();
  });

  it("selects an item on click, closes, and reopens on the next press", async () => {
    const user = userEvent.setup();
    const { onSelect } = mount();
    await user.click(trigger());
    await user.click(screen.getByRole("menuitem", { name: "Open" }));
    expect(onSelect).toHaveBeenCalledWith("open");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveFocus();

    await user.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
  });

  it("reports the choice after the menu has closed", async () => {
    const user = userEvent.setup();
    const { host } = mount();
    let expanded: string | null = null;
    host.addEventListener("select", () => (expanded = trigger().getAttribute("aria-expanded")));
    await user.click(trigger());
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(expanded).toBe("false");
  });

  it("opens with the keyboard and activates via Enter, skipping disabled", async () => {
    const user = userEvent.setup();
    const { onSelect } = mount();
    trigger().focus();
    await user.keyboard("{ArrowDown}"); // open, active = New file
    await user.keyboard("{ArrowDown}"); // -> Open
    await user.keyboard("{ArrowDown}"); // -> (Rename disabled) -> Delete
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("delete");
  });

  it("opens on the last item with ArrowUp and moves with Home and End", async () => {
    const user = userEvent.setup();
    mount();
    trigger().focus();
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("menuitem", { name: "New file" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveFocus();
  });

  it("moves the highlight by typeahead", async () => {
    const user = userEvent.setup();
    mount();
    trigger().focus();
    await user.keyboard("{ArrowDown}");
    await user.keyboard("d");
    expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveFocus();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(trigger());
    await user.keyboard("{Escape}");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveFocus();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("closes on a press outside", async () => {
    const user = userEvent.setup();
    mount();
    document.body.insertAdjacentHTML("beforeend", "<p>Outside</p>");
    await user.click(trigger());
    await user.click(screen.getByText("Outside"));
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("stays closed while disabled", async () => {
    const user = userEvent.setup();
    mount(ITEMS, "disabled");
    expect(trigger()).toHaveAttribute("aria-disabled", "true");
    await user.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("renders groups, separators and checkable items", async () => {
    const user = userEvent.setup();
    mount([
      {
        type: "group",
        label: "Sort by",
        items: [
          { value: "name", label: "Name", kind: "radio", checked: true },
          { value: "date", label: "Date", kind: "radio" },
        ],
      },
      { type: "separator" },
      { value: "compact", label: "Compact rows", kind: "checkbox", checked: false },
      { value: "rename", label: "Rename" },
    ]);
    await user.click(trigger());

    const name = screen.getByRole("menuitemradio", { name: "Name" });
    expect(name).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitemradio", { name: "Date" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(screen.getByRole("menuitemcheckbox", { name: "Compact rows" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    expect(screen.getByRole("menuitem", { name: "Rename" })).not.toHaveAttribute("aria-checked");

    expect(screen.getByRole("group", { name: "Sort by" })).toContainElement(name);
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("walks through grouped items with the arrow keys, skipping the separator", async () => {
    const user = userEvent.setup();
    mount([
      { type: "group", label: "Sort by", items: [{ value: "name", label: "Name" }] },
      { type: "separator" },
      { value: "rename", label: "Rename" },
    ]);
    await user.click(trigger());
    expect(screen.getByRole("menuitem", { name: "Name" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Rename" })).toHaveFocus();
  });

  it("marks disabled items", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(trigger());
    expect(screen.getByRole("menuitem", { name: "Rename" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("renders labels as text", async () => {
    const user = userEvent.setup();
    mount([{ value: "x", label: "<img src=x onerror=alert(1)>" }]);
    await user.click(trigger());
    expect(screen.getByRole("menuitem")).toHaveTextContent("<img src=x onerror=alert(1)>");
    expect(document.querySelector("img")).toBeNull();
  });

  it("takes items assigned before the element connects", () => {
    document.body.innerHTML = "";
    const host = document.createElement("ds-dropdown-menu") as DsDropdownMenu;
    host.setAttribute("label", "Actions");
    host.items = [{ value: "one", label: "One" }];
    document.body.appendChild(host);
    expect(host.querySelectorAll(".menu__item")).toHaveLength(1);
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(trigger());
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe("<ds-dropdown-menu> disabled look", () => {
  it("marks a disabled trigger for the stylesheet, and clears it when enabled", () => {
    document.body.innerHTML = `<ds-dropdown-menu label="Actions" disabled></ds-dropdown-menu>`;
    const menu = document.querySelector("ds-dropdown-menu")!;
    const trigger = menu.querySelector(".menu__trigger")!;
    expect(trigger).toHaveAttribute("data-disabled");
    menu.removeAttribute("disabled");
    expect(trigger).not.toHaveAttribute("data-disabled");
  });
});
