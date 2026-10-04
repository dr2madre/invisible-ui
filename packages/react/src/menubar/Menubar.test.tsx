import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { LocaleProvider } from "../i18n/i18n";
import { Menubar, type MenubarMenu, type MenubarProps } from "./Menubar";

const menus: MenubarMenu[] = [
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
      {
        type: "submenu",
        value: "find",
        label: "Find",
        items: [
          { value: "find-next", label: "Find next" },
          { value: "replace", label: "Replace" },
        ],
      },
      { type: "separator" },
      { type: "group", label: "Paste", items: [{ value: "paste", label: "Paste plain" }] },
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

function Fixture(props: Partial<MenubarProps>) {
  return <Menubar label="Main" menus={menus} {...props} />;
}

const trigger = (name: string) =>
  within(screen.getByRole("menubar")).getByRole("menuitem", { name });
const item = (name: string) => screen.getByRole("menuitem", { name });

afterEach(() => vi.useRealTimers());

describe("React Menubar", () => {
  it("renders a horizontal menubar with roving tabindex", () => {
    render(<Fixture />);
    expect(screen.getByRole("menubar", { name: "Main" })).toHaveAttribute(
      "aria-orientation",
      "horizontal",
    );
    expect(trigger("File")).toHaveAttribute("tabindex", "0");
    expect(trigger("Edit")).toHaveAttribute("tabindex", "-1");
    expect(trigger("View")).toHaveAttribute("tabindex", "-1");
    expect(trigger("File")).toHaveAttribute("aria-haspopup", "menu");
  });

  it("opens a menu on click and exposes its items", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await user.click(trigger("File"));
    expect(trigger("File")).toHaveAttribute("aria-expanded", "true");
    const menu = screen.getByRole("menu", { name: "File" });
    expect(within(menu).getAllByRole("menuitem")).toHaveLength(3);
    expect(within(menu).getByRole("menuitem", { name: "Save" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("renders groups and separators", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await user.click(trigger("Edit"));
    expect(screen.getByRole("separator")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Paste" })).toContainElement(item("Paste plain"));
  });

  it("gives a disabled trigger the disabled look, and keeps it shut", async () => {
    const user = userEvent.setup();
    render(<Fixture menus={[{ value: "file", label: "File", items: [], disabled: true }]} />);
    expect(trigger("File")).toHaveAttribute("aria-disabled", "true");
    expect(trigger("File")).toHaveAttribute("data-disabled");
    await user.click(trigger("File"));
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("activates an item, closing before it reports", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn(() => {
      expect(screen.queryByRole("menu")).toBeNull();
      expect(trigger("Edit")).toHaveFocus();
    });
    render(<Fixture onSelect={onSelect} />);
    await user.click(trigger("Edit"));
    await user.click(item("Undo"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("edit", "undo");
    expect(trigger("Edit")).toHaveAttribute("aria-expanded", "false");
  });

  it("moves focus between triggers with ArrowLeft and ArrowRight while closed", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    trigger("File").focus();
    await user.keyboard("{ArrowRight}");
    expect(trigger("Edit")).toHaveFocus();
    expect(trigger("Edit")).toHaveAttribute("tabindex", "0");
    await user.keyboard("{ArrowRight}{ArrowRight}");
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
    render(<Fixture />);
    await user.click(trigger("File"));
    await user.keyboard("{ArrowRight}");
    expect(trigger("File")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("Edit")).toHaveAttribute("aria-expanded", "true");
    expect(item("Undo")).toHaveFocus();
  });

  it("opens with the keyboard and activates the active item via Enter", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Fixture onSelect={onSelect} />);
    trigger("File").focus();
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith("file", "open");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await user.click(trigger("View"));
    await user.keyboard("{Escape}");
    expect(trigger("View")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("View")).toHaveFocus();
  });

  it("switches the open menu on hover while one is open", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await user.click(trigger("File"));
    fireEvent.pointerEnter(trigger("View"), { pointerType: "mouse" });
    expect(trigger("View")).toHaveAttribute("aria-expanded", "true");
    expect(trigger("File")).toHaveAttribute("aria-expanded", "false");
  });

  it("renders and navigates menus given after mount, with the callback given after mount", async () => {
    const user = userEvent.setup();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<Fixture onSelect={first} />);
    rerender(
      <Fixture
        onSelect={second}
        menus={[
          { value: "file", label: "File", items: [{ value: "close", label: "Close" }] },
          { value: "help", label: "Help", items: [{ value: "about", label: "About" }] },
        ]}
      />,
    );
    expect(screen.queryByRole("menuitem", { name: "Edit" })).toBeNull();
    trigger("File").focus();
    await user.keyboard("{ArrowRight}");
    expect(trigger("Help")).toHaveFocus();
    await user.keyboard("{ArrowLeft}{ArrowDown}{Enter}");
    expect(second).toHaveBeenCalledWith("file", "close");
    expect(first).not.toHaveBeenCalled();
  });

  it("has no accessibility violations, closed and with a submenu open", async () => {
    const user = userEvent.setup();
    const { container } = render(<Fixture />);
    expect(await axe(container)).toHaveNoViolations();
    await user.click(trigger("Edit"));
    await user.keyboard("{ArrowDown}{ArrowRight}");
    expect(
      await axe(document.body, { rules: { region: { enabled: false } } }),
    ).toHaveNoViolations();
  });
});

describe("React Menubar submenus", () => {
  it("opens a submenu with the arrow toward the inline end on its trigger", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    trigger("Edit").focus();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(item("Find")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(item("Find")).toHaveAttribute("aria-expanded", "true");
    expect(item("Find next")).toHaveFocus();
    expect(trigger("Edit")).toHaveAttribute("aria-expanded", "true");
  });

  it("moves to the next top menu with the arrow toward the inline end on a plain item, at any level", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    trigger("Edit").focus();
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowRight}");
    expect(item("Find next")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(trigger("Edit")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("View")).toHaveAttribute("aria-expanded", "true");
    expect(item("Zoom in")).toHaveFocus();
  });

  it("closes one level with the arrow toward the inline start in a submenu, and moves back in the root menu", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    trigger("Edit").focus();
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowRight}");
    await user.keyboard("{ArrowLeft}");
    expect(item("Find")).toHaveFocus();
    expect(item("Find")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("Edit")).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{ArrowLeft}");
    expect(trigger("File")).toHaveAttribute("aria-expanded", "true");
    expect(item("New")).toHaveFocus();
  });

  it("closes one level on Escape in a submenu, then the menu", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    trigger("Edit").focus();
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowRight}{Escape}");
    expect(item("Find")).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(trigger("Edit")).toHaveFocus();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("reports an item chosen in a submenu with its top menu, once", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Fixture onSelect={onSelect} />);
    trigger("Edit").focus();
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowRight}{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("edit", "replace");
    expect(trigger("Edit")).toHaveFocus();
  });

  it("mirrors both arrow rules in right-to-left text", async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider locale="he">
        <Fixture />
      </LocaleProvider>,
    );
    trigger("File").focus();
    // ArrowLeft goes to the next top menu in right-to-left text.
    await user.keyboard("{ArrowLeft}");
    expect(trigger("Edit")).toHaveFocus();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    await user.keyboard("{ArrowLeft}");
    expect(item("Find next")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(item("Find")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(trigger("File")).toHaveAttribute("aria-expanded", "true");
  });

  it("opens a submenu after the hover delay", () => {
    vi.useFakeTimers();
    render(<Fixture />);
    fireEvent.click(trigger("Edit"));
    fireEvent.pointerEnter(item("Find"), { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(100));
    expect(item("Find")).toHaveAttribute("aria-expanded", "true");
  });
});
