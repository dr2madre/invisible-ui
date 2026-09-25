import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsMenubar, MenubarMenu } from "./ds-menubar";

const MENUS: MenubarMenu[] = [
  {
    value: "file",
    label: "File",
    items: [
      { value: "new", label: "New" },
      { value: "open", label: "Open" },
      { value: "save", label: "Save", disabled: true },
    ],
  },
  {
    value: "edit",
    label: "Edit",
    items: [
      { value: "undo", label: "Undo" },
      { value: "redo", label: "Redo" },
    ],
  },
  {
    value: "view",
    label: "View",
    items: [
      { value: "zoom-in", label: "Zoom in" },
      { value: "zoom-out", label: "Zoom out" },
    ],
  },
];

const mount = () => {
  document.body.innerHTML = `<ds-menubar label="Main"></ds-menubar><p>Outside</p>`;
  const host = document.querySelector("ds-menubar") as DsMenubar;
  host.menus = MENUS;
  const onSelect = vi.fn();
  host.addEventListener("select", (event) => {
    const { menu, value } = (event as CustomEvent<{ menu: string; value: string }>).detail;
    onSelect(menu, value);
  });
  return { host, onSelect };
};
const trigger = (name: string) => screen.getByRole("menuitem", { name });
const menu = (name: string) => screen.getByRole("menu", { name });

describe("<ds-menubar>", () => {
  it("renders a named horizontal menubar with a roving tabindex", () => {
    mount();
    const bar = screen.getByRole("menubar", { name: "Main" });
    expect(bar).toHaveAttribute("aria-orientation", "horizontal");
    expect(trigger("File")).toHaveAttribute("tabindex", "0");
    expect(trigger("Edit")).toHaveAttribute("tabindex", "-1");
    expect(trigger("View")).toHaveAttribute("tabindex", "-1");
    expect(trigger("File")).toHaveAttribute("aria-haspopup", "menu");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens a menu on click and exposes its items", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(trigger("File"));
    expect(trigger("File")).toHaveAttribute("aria-expanded", "true");
    expect(within(menu("File")).getAllByRole("menuitem")).toHaveLength(3);
    expect(within(menu("File")).getByRole("menuitem", { name: "Save" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(within(menu("File")).getByRole("menuitem", { name: "New" })).toHaveFocus();
  });

  it("activates an item, closes, and reports the menu and the item", async () => {
    const user = userEvent.setup();
    const { onSelect } = mount();
    await user.click(trigger("Edit"));
    await user.click(within(menu("Edit")).getByRole("menuitem", { name: "Redo" }));
    expect(onSelect).toHaveBeenCalledWith("edit", "redo");
    expect(trigger("Edit")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("Edit")).toHaveFocus();
  });

  it("moves focus between triggers with ArrowLeft, ArrowRight, Home and End", async () => {
    const user = userEvent.setup();
    mount();
    trigger("File").focus();
    await user.keyboard("{ArrowRight}");
    expect(trigger("Edit")).toHaveFocus();
    expect(trigger("Edit")).toHaveAttribute("tabindex", "0");
    expect(trigger("File")).toHaveAttribute("tabindex", "-1");
    await user.keyboard("{ArrowRight}");
    expect(trigger("View")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(trigger("File")).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(trigger("View")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(trigger("File")).toHaveFocus();
    await user.keyboard("{End}");
    expect(trigger("View")).toHaveFocus();
  });

  it("switches the open menu with ArrowRight while open", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(trigger("File"));
    await user.keyboard("{ArrowRight}");
    expect(trigger("File")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("Edit")).toHaveAttribute("aria-expanded", "true");
    expect(within(menu("Edit")).getByRole("menuitem", { name: "Undo" })).toHaveFocus();
    expect(trigger("Edit")).toHaveAttribute("tabindex", "0");
  });

  it("switches the open menu on hover", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(trigger("File"));
    await user.hover(trigger("View"));
    expect(trigger("File")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("View")).toHaveAttribute("aria-expanded", "true");
  });

  it("opens with the keyboard and activates the active item via Enter", async () => {
    const user = userEvent.setup();
    const { onSelect } = mount();
    trigger("File").focus();
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("file", "open");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(trigger("View"));
    await user.keyboard("{Escape}");
    expect(trigger("View")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("View")).toHaveFocus();
  });

  it("closes on an outside press", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(trigger("File"));
    await user.click(screen.getByText("Outside"));
    expect(trigger("File")).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps a disabled menu closed", async () => {
    const user = userEvent.setup();
    const { host } = mount();
    host.menus = [...MENUS.slice(0, 2), { ...MENUS[2]!, disabled: true }];
    await user.click(trigger("View"));
    expect(trigger("View")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("View")).toHaveAttribute("aria-disabled", "true");
  });

  it("renders labels as text", () => {
    const { host } = mount();
    host.menus = [{ value: "x", label: "<img src=x onerror=alert(1)>", items: [] }];
    expect(trigger("<img src=x onerror=alert(1)>")).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
  });

  it("has no accessibility violations", async () => {
    mount();
    expect(await axe(document.body)).toHaveNoViolations();
    const user = userEvent.setup();
    await user.click(trigger("File"));
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
