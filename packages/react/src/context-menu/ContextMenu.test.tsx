import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { LocaleProvider } from "../i18n/i18n";
import type { MenuEntry } from "../dropdown-menu/DropdownMenu";
import { ContextMenu, type ContextMenuProps } from "./ContextMenu";

const plain: MenuEntry[] = [
  { value: "back", label: "Back" },
  { value: "reload", label: "Reload" },
  { value: "save", label: "Save as…", disabled: true },
  { value: "inspect", label: "Inspect" },
];

const nested: MenuEntry[] = [
  { value: "back", label: "Back" },
  {
    type: "submenu",
    value: "share",
    label: "Share",
    items: [
      { value: "email", label: "Email" },
      { value: "link", label: "Copy link" },
    ],
  },
  { type: "separator" },
  {
    type: "group",
    label: "View",
    items: [{ value: "zoom", label: "Zoom", kind: "checkbox", checked: true }],
  },
];

function Fixture(props: Partial<ContextMenuProps>) {
  return (
    <>
      <button type="button">before</button>
      <ContextMenu items={plain} label="Page actions" {...props}>
        <div>Right-click here</div>
      </ContextMenu>
      <button type="button">after</button>
    </>
  );
}

const openAt = (x = 40, y = 40) =>
  fireEvent.contextMenu(screen.getByText("Right-click here"), { clientX: x, clientY: y });
const item = (name: string) => screen.getByRole("menuitem", { name });

afterEach(() => vi.useRealTimers());

describe("React ContextMenu", () => {
  it("is closed until the region is right-clicked", () => {
    render(<Fixture />);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens at the pointer on contextmenu and exposes the items", () => {
    render(<Fixture />);
    openAt();
    const menu = screen.getByRole("menu");
    expect(menu).toHaveAttribute("aria-label", "Page actions");
    expect(menu).not.toHaveAttribute("aria-labelledby");
    expect(screen.getAllByRole("menuitem")).toHaveLength(4);
    expect(item("Back")).toHaveFocus();
  });

  it("names the menu from the catalog by default", () => {
    render(
      <LocaleProvider messages={{ "contextMenu.label": "Menu contestuale" }}>
        <ContextMenu items={plain}>
          <div>Right-click here</div>
        </ContextMenu>
      </LocaleProvider>,
    );
    openAt();
    expect(screen.getByRole("menu", { name: "Menu contestuale" })).toBeInTheDocument();
  });

  it("selects an item on click and closes", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Fixture onSelect={onSelect} />);
    openAt();
    await user.click(item("Reload"));
    expect(onSelect).toHaveBeenCalledWith("reload");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("navigates with the keyboard and activates via Enter, skipping disabled", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Fixture onSelect={onSelect} />);
    openAt();
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith("inspect");
  });

  it("closes on Escape and restores focus to where it was", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    const before = screen.getByRole("button", { name: "before" });
    before.focus();
    openAt();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(before).toHaveFocus();
  });

  it("closes on an outside pointer press", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    openAt();
    await user.click(screen.getByRole("button", { name: "after" }));
    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
  });

  it("closes when the page scrolls under it, but not when the menu scrolls", () => {
    render(<Fixture />);
    openAt();
    fireEvent.scroll(screen.getByRole("menu"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens again at a new point while open, back on the first item", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    openAt();
    await user.keyboard("{ArrowDown}");
    openAt(80, 80);
    expect(screen.getAllByRole("menu")).toHaveLength(1);
    expect(item("Back")).toHaveFocus();
  });

  it("opens on a long press on touch, and not when the finger moves", () => {
    vi.useFakeTimers();
    render(<Fixture />);
    const region = screen.getByText("Right-click here");
    fireEvent.pointerDown(region, { pointerType: "touch", clientX: 10, clientY: 10 });
    fireEvent.pointerMove(region, { pointerType: "touch", clientX: 30, clientY: 10 });
    act(() => vi.advanceTimersByTime(600));
    expect(screen.queryByRole("menu")).toBeNull();

    fireEvent.pointerDown(region, { pointerType: "touch", clientX: 10, clientY: 10 });
    act(() => vi.advanceTimersByTime(499));
    expect(screen.queryByRole("menu")).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("marks disabled items", () => {
    render(<Fixture />);
    openAt();
    expect(item("Save as…")).toHaveAttribute("aria-disabled", "true");
  });

  it("has no accessibility violations when open with a submenu", async () => {
    const user = userEvent.setup();
    render(<Fixture items={nested} />);
    openAt();
    await user.keyboard("{ArrowDown}{ArrowRight}");
    expect(
      await axe(document.body, { rules: { region: { enabled: false } } }),
    ).toHaveNoViolations();
  });

  it("navigates items and runs the callback given after mount", async () => {
    const user = userEvent.setup();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<Fixture onSelect={first} />);
    rerender(
      <Fixture
        onSelect={second}
        items={[
          { value: "back", label: "Back" },
          { value: "share", label: "Share" },
        ]}
      />,
    );
    openAt();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(second).toHaveBeenCalledWith("share");
    expect(first).not.toHaveBeenCalled();
  });

  it("stays shut once disabled after mount", () => {
    const { rerender } = render(<Fixture />);
    rerender(<Fixture disabled />);
    openAt();
    expect(screen.queryByRole("menu")).toBeNull();
  });
});

describe("React ContextMenu submenus", () => {
  it("renders groups, separators and checkable items", () => {
    render(<Fixture items={nested} />);
    openAt();
    expect(screen.getByRole("separator")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "View" })).toContainElement(
      screen.getByRole("menuitemcheckbox", { name: "Zoom" }),
    );
  });

  it("opens a submenu by key and returns focus to the element focused before opening", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn(() => {
      expect(screen.queryByRole("menu")).toBeNull();
      expect(before).toHaveFocus();
    });
    render(<Fixture items={nested} onSelect={onSelect} />);
    const before = screen.getByRole("button", { name: "before" });
    before.focus();
    openAt();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(item("Email")).toHaveFocus();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("link");
    expect(before).toHaveFocus();
  });

  it("closes one level on Escape and the arrow toward the inline start", async () => {
    const user = userEvent.setup();
    render(<Fixture items={nested} />);
    openAt();
    await user.keyboard("{ArrowDown}{ArrowRight}{ArrowLeft}");
    expect(item("Share")).toHaveFocus();
    expect(item("Share")).toHaveAttribute("aria-expanded", "false");
    await user.keyboard("{ArrowRight}{Escape}");
    expect(item("Share")).toHaveFocus();
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });
});
