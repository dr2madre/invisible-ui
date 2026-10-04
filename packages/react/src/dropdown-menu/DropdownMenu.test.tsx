import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Dialog } from "../dialog/Dialog";
import { LocaleProvider } from "../i18n/i18n";
import { DropdownMenu, type DropdownMenuProps, type MenuEntry } from "./DropdownMenu";

const plain: MenuEntry[] = [
  { value: "new", label: "New file" },
  { value: "open", label: "Open" },
  { value: "rename", label: "Rename", disabled: true },
  { value: "delete", label: "Delete" },
];

const nested: MenuEntry[] = [
  { value: "new", label: "New file" },
  {
    type: "submenu",
    value: "share",
    label: "Share",
    items: [
      { value: "email", label: "Email" },
      { value: "link", label: "Copy link" },
      { value: "embed", label: "Embed", kind: "checkbox", checked: false },
      {
        type: "submenu",
        value: "more",
        label: "More",
        items: [{ value: "print", label: "Print" }],
      },
    ],
  },
  { value: "rename", label: "Rename" },
  {
    type: "submenu",
    value: "export",
    label: "Export",
    disabled: true,
    items: [{ value: "pdf", label: "PDF" }],
  },
  { value: "delete", label: "Delete" },
];

function Fixture(props: Partial<DropdownMenuProps>) {
  return <DropdownMenu label="Actions" items={plain} {...props} />;
}

const trigger = () => screen.getByRole("button", { name: "Actions" });
const item = (name: string) => screen.getByRole("menuitem", { name });
const submenuOf = (name: string) =>
  document.getElementById(item(name).getAttribute("aria-controls") ?? "");

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("React DropdownMenu", () => {
  it("renders a closed menu button", () => {
    render(<Fixture />);
    expect(trigger()).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens on click and exposes the menu items", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await user.click(trigger());
    expect(screen.getByRole("menu")).toHaveAttribute("aria-labelledby", trigger().id);
    expect(screen.getAllByRole("menuitem")).toHaveLength(4);
    expect(item("New file")).toHaveFocus();
  });

  it("closes before it reports the chosen item, with focus on the trigger", async () => {
    const user = userEvent.setup();
    const seen: [string, string | null, boolean][] = [];
    const onSelect = vi.fn((value: string) => {
      seen.push([
        value,
        trigger().getAttribute("aria-expanded"),
        trigger() === document.activeElement,
      ]);
    });
    render(<Fixture onSelect={onSelect} />);
    await user.click(trigger());
    await user.click(item("Open"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(seen).toEqual([["open", "false", true]]);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens with the keyboard and activates via Enter, skipping disabled", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Fixture onSelect={onSelect} />);
    trigger().focus();
    await user.keyboard("{ArrowDown}"); // open, active = New file
    await user.keyboard("{ArrowDown}"); // -> Open
    await user.keyboard("{ArrowDown}"); // -> (Rename disabled) -> Delete
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("delete");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await user.click(trigger());
    await user.keyboard("{Escape}");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveFocus();
  });

  it("renders groups, separators and checkable items", async () => {
    const user = userEvent.setup();
    render(
      <Fixture
        items={[
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
        ]}
      />,
    );
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
    expect(item("Rename")).not.toHaveAttribute("aria-checked");
    expect(screen.getByRole("group", { name: "Sort by" })).toContainElement(name);
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });

  it("walks through grouped items with the arrow keys, skipping the separator", async () => {
    const user = userEvent.setup();
    render(
      <Fixture
        items={[
          { type: "group", label: "Sort by", items: [{ value: "name", label: "Name" }] },
          { type: "separator" },
          { value: "rename", label: "Rename" },
        ]}
      />,
    );
    await user.click(trigger());
    expect(item("Name")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(item("Rename")).toHaveFocus();
  });

  it("marks disabled items", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await user.click(trigger());
    expect(item("Rename")).toHaveAttribute("aria-disabled", "true");
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
          { value: "new", label: "New file" },
          { value: "archive", label: "Archive" },
        ]}
      />,
    );
    trigger().focus();
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");
    expect(second).toHaveBeenCalledWith("archive");
    expect(first).not.toHaveBeenCalled();
  });

  it("stays shut once disabled after mount, and closes when disabled while open", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Fixture />);
    await user.click(trigger());
    rerender(<Fixture disabled />);
    expect(screen.queryByRole("menu")).toBeNull();
    await user.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveAttribute("data-disabled");
  });

  it("has no accessibility violations with a submenu open", async () => {
    const user = userEvent.setup();
    render(<Fixture items={nested} />);
    await user.click(trigger());
    await user.keyboard("{ArrowDown}{ArrowRight}");
    // The popup sits in the body, outside the page's landmarks, by design.
    expect(
      await axe(document.body, { rules: { region: { enabled: false } } }),
    ).toHaveNoViolations();
  });
});

describe("React DropdownMenu submenus: keyboard", () => {
  it.each([["{Enter}"], [" "], ["{ArrowRight}"]])(
    "%s on a submenu trigger opens it and focuses its first item",
    async (key) => {
      const user = userEvent.setup();
      render(<Fixture items={nested} />);
      await user.click(trigger());
      await user.keyboard("{ArrowDown}");
      const share = item("Share");
      expect(share).toHaveFocus();
      expect(share).toHaveAttribute("aria-haspopup", "menu");
      expect(share).toHaveAttribute("aria-expanded", "false");
      expect(share).not.toHaveAttribute("aria-controls");

      await user.keyboard(key);
      expect(share).toHaveAttribute("aria-expanded", "true");
      expect(share).toHaveAttribute("data-state", "open");
      const submenu = submenuOf("Share")!;
      expect(submenu).toHaveAttribute("role", "menu");
      expect(submenu).toHaveAttribute("aria-labelledby", share.id);
      expect(submenu).toHaveAttribute("data-level", "1");
      expect(item("Email")).toHaveFocus();
      // A submenu stays inside the root popup, so its keys reach the root.
      expect(screen.getAllByRole("menu")[0]).toContainElement(submenu);
    },
  );

  it("closes one level on ArrowLeft and on Escape, focusing the parent item", async () => {
    const user = userEvent.setup();
    render(<Fixture items={nested} />);
    await user.click(trigger());
    await user.keyboard("{ArrowDown}{ArrowRight}");
    await user.keyboard("{ArrowUp}{ArrowRight}"); // -> More, open it
    expect(item("Print")).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(item("More")).toHaveFocus();
    expect(item("More")).toHaveAttribute("aria-expanded", "false");
    expect(item("Share")).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");
    expect(item("Share")).toHaveFocus();
    expect(item("Share")).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(trigger()).toHaveFocus();
  });

  it("closes every level on Tab, from the trigger, so Tab moves on from there", async () => {
    const user = userEvent.setup();
    render(<Fixture items={nested} />);
    await user.click(trigger());
    await user.keyboard("{ArrowDown}{ArrowRight}");
    const tab = fireEvent.keyDown(item("Email"), { key: "Tab" });
    // The key is left to the browser, which moves focus on from the trigger.
    expect(tab).toBe(true);
    expect(screen.queryByRole("menu")).toBeNull();
    expect(trigger()).toHaveFocus();
  });

  it("closes every level on an outside press, leaving focus where the press put it", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Fixture items={nested} />
        <input aria-label="Elsewhere" />
      </>,
    );
    await user.click(trigger());
    await user.keyboard("{ArrowDown}{ArrowRight}");
    await user.click(screen.getByRole("textbox", { name: "Elsewhere" }));
    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.getByRole("textbox", { name: "Elsewhere" })).toHaveFocus();
  });

  it("keeps typeahead within the level that has focus", async () => {
    const user = userEvent.setup();
    render(<Fixture items={nested} />);
    await user.click(trigger());
    await user.keyboard("{ArrowDown}{ArrowRight}");
    expect(item("Email")).toHaveFocus();
    // "d" matches Delete in the root menu only: nothing moves.
    await user.keyboard("d");
    expect(item("Email")).toHaveFocus();
    await user.keyboard("{Escape}");
    await new Promise((resolve) => setTimeout(resolve, 600));
    await user.keyboard("d");
    expect(item("Delete")).toHaveFocus();
  });

  it("closes every level, returns focus, then reports an item chosen in a submenu once", async () => {
    const user = userEvent.setup();
    const seen: [string, boolean, boolean][] = [];
    const onSelect = vi.fn((value: string) => {
      seen.push([value, screen.queryByRole("menu") === null, trigger() === document.activeElement]);
    });
    render(<Fixture items={nested} onSelect={onSelect} />);
    await user.click(trigger());
    await user.keyboard("{ArrowDown}{ArrowRight}{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("link");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(seen[0]?.[0]).toBe("link");
    expect(seen[0]?.[2]).toBe(true);
  });

  it("never reports a submenu trigger", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Fixture items={nested} onSelect={onSelect} />);
    await user.click(trigger());
    await user.click(item("Share"));
    expect(onSelect).not.toHaveBeenCalled();
    expect(item("Share")).toHaveAttribute("aria-expanded", "true");
  });

  it("changes a checkable item on Space and stays open; Enter closes", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Fixture items={nested} onSelect={onSelect} />);
    await user.click(trigger());
    await user.keyboard("{ArrowDown}{ArrowRight}{ArrowDown}{ArrowDown}");
    expect(screen.getByRole("menuitemcheckbox", { name: "Embed" })).toHaveFocus();
    await user.keyboard(" ");
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("embed");
    expect(screen.getByRole("menuitemcheckbox", { name: "Embed" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens a disabled submenu trigger by no key, press or hover", async () => {
    vi.useFakeTimers();
    render(<Fixture items={nested} />);
    fireEvent.click(trigger());
    const exportItem = item("Export");
    expect(exportItem).toHaveAttribute("aria-disabled", "true");
    exportItem.focus();
    for (const key of ["Enter", " ", "ArrowRight"]) {
      fireEvent.keyDown(exportItem, { key });
      expect(exportItem).toHaveAttribute("aria-expanded", "false");
    }
    fireEvent.click(exportItem);
    fireEvent.pointerEnter(exportItem, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(500));
    expect(exportItem).toHaveAttribute("aria-expanded", "false");
  });

  it("mirrors the arrows in right-to-left text", async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider locale="ar">
        <Fixture items={nested} />
      </LocaleProvider>,
    );
    await user.click(trigger());
    expect(screen.getByRole("menu")).toHaveAttribute("dir", "rtl");
    await user.keyboard("{ArrowDown}{ArrowRight}");
    expect(item("Share")).toHaveAttribute("aria-expanded", "false");
    await user.keyboard("{ArrowLeft}");
    expect(item("Email")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(item("Share")).toHaveFocus();
    expect(item("Share")).toHaveAttribute("aria-expanded", "false");
  });

  it("cuts the open path, silently, when the items drop an open submenu", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { rerender } = render(<Fixture items={nested} onSelect={onSelect} />);
    await user.click(trigger());
    await user.keyboard("{ArrowDown}{ArrowRight}");
    expect(submenuOf("Share")).not.toBeNull();
    rerender(<Fixture items={nested.filter((entry) => !("type" in entry))} onSelect={onSelect} />);
    expect(screen.getAllByRole("menu")).toHaveLength(1);
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("React DropdownMenu submenus: pointer", () => {
  it("opens after the pointer rests 100 ms on a trigger, and a sibling closes it after 100 ms", () => {
    vi.useFakeTimers();
    render(<Fixture items={nested} />);
    fireEvent.click(trigger());
    const share = item("Share");

    fireEvent.pointerEnter(share, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(99));
    expect(share).toHaveAttribute("aria-expanded", "false");
    act(() => vi.advanceTimersByTime(1));
    expect(share).toHaveAttribute("aria-expanded", "true");
    // Hover leaves focus on the trigger.
    expect(share).toHaveFocus();

    fireEvent.pointerLeave(share, { pointerType: "mouse" });
    fireEvent.pointerEnter(item("Rename"), { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(99));
    expect(share).toHaveAttribute("aria-expanded", "true");
    act(() => vi.advanceTimersByTime(1));
    expect(share).toHaveAttribute("aria-expanded", "false");
    expect(item("Rename")).toHaveFocus();
  });

  it("does not open when the pointer leaves before the delay", () => {
    vi.useFakeTimers();
    render(<Fixture items={nested} />);
    fireEvent.click(trigger());
    fireEvent.pointerEnter(item("Share"), { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(50));
    fireEvent.pointerLeave(item("Share"), { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(200));
    expect(item("Share")).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps the submenu open across the grace area, and ends it after 300 ms of rest", () => {
    vi.useFakeTimers();
    // Geometry: the root popup spans x 0 to 200; the submenu opens at its
    // right edge; Rename sits below Share.
    const rects = new Map<string, DOMRect>();
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement,
    ) {
      const key =
        this.getAttribute("role") === "menu"
          ? `menu-${this.dataset.level}`
          : (this.dataset.value ?? "");
      return rects.get(key) ?? new DOMRect(0, 0, 0, 0);
    });
    vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(1000);
    vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(800);
    rects.set("menu-0", new DOMRect(0, 0, 200, 200));
    rects.set("share", new DOMRect(0, 30, 200, 30));
    rects.set("rename", new DOMRect(0, 60, 200, 30));
    rects.set("menu-1", new DOMRect(200, 30, 150, 120));

    render(<Fixture items={nested} />);
    fireEvent.click(trigger());
    const share = item("Share");
    fireEvent.pointerEnter(share, { pointerType: "mouse", clientX: 150, clientY: 45 });
    act(() => vi.advanceTimersByTime(100));
    expect(submenuOf("Share")).toHaveAttribute("data-side", "right");

    // Leave toward the submenu, crossing Rename inside the grace area.
    fireEvent.pointerLeave(share, { pointerType: "mouse", clientX: 190, clientY: 59 });
    fireEvent.pointerEnter(item("Rename"), { pointerType: "mouse", clientX: 195, clientY: 62 });
    fireEvent.pointerMove(document, { pointerType: "mouse", clientX: 195, clientY: 62 });
    act(() => vi.advanceTimersByTime(250));
    expect(share).toHaveAttribute("aria-expanded", "true");
    expect(share).toHaveFocus();

    // Resting 300 ms ends the grace; Rename then acts as hovered.
    act(() => vi.advanceTimersByTime(50));
    expect(item("Rename")).toHaveFocus();
    act(() => vi.advanceTimersByTime(100));
    expect(share).toHaveAttribute("aria-expanded", "false");
  });

  it("ends the grace at once when the pointer leaves the area", () => {
    vi.useFakeTimers();
    const rects = new Map<string, DOMRect>([
      ["menu-0", new DOMRect(0, 0, 200, 200)],
      ["share", new DOMRect(0, 30, 200, 30)],
      ["menu-1", new DOMRect(200, 30, 150, 120)],
    ]);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
      this: HTMLElement,
    ) {
      const key =
        this.getAttribute("role") === "menu"
          ? `menu-${this.dataset.level}`
          : (this.dataset.value ?? "");
      return rects.get(key) ?? new DOMRect(0, 0, 0, 0);
    });
    vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(1000);
    vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(800);
    render(<Fixture items={nested} />);
    fireEvent.click(trigger());
    const share = item("Share");
    fireEvent.pointerEnter(share, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(100));
    fireEvent.pointerLeave(share, { pointerType: "mouse", clientX: 190, clientY: 59 });
    fireEvent.pointerEnter(item("Rename"), { pointerType: "mouse", clientX: 195, clientY: 62 });
    // Straight down, away from the submenu: out of the area.
    fireEvent.pointerMove(document, { pointerType: "mouse", clientX: 100, clientY: 75 });
    expect(item("Rename")).toHaveFocus();
    act(() => vi.advanceTimersByTime(100));
    expect(share).toHaveAttribute("aria-expanded", "false");
  });

  it("ends the grace when the pointer enters the submenu", () => {
    vi.useFakeTimers();
    vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(1000);
    vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(800);
    render(<Fixture items={nested} />);
    fireEvent.click(trigger());
    const share = item("Share");
    fireEvent.pointerEnter(share, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(100));
    fireEvent.pointerLeave(share, { pointerType: "mouse" });
    fireEvent.pointerEnter(submenuOf("Share")!, { pointerType: "mouse" });
    fireEvent.pointerEnter(item("Email"), { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(1000));
    expect(share).toHaveAttribute("aria-expanded", "true");
    expect(item("Email")).toHaveFocus();
  });

  it("opens on a tap and closes on a second tap; a mouse press keeps it open", () => {
    render(<Fixture items={nested} />);
    fireEvent.click(trigger());
    const share = item("Share");
    fireEvent.pointerDown(share, { pointerType: "touch" });
    fireEvent.click(share);
    expect(share).toHaveAttribute("aria-expanded", "true");
    fireEvent.pointerDown(share, { pointerType: "mouse" });
    fireEvent.click(share);
    expect(share).toHaveAttribute("aria-expanded", "true");
    fireEvent.pointerDown(share, { pointerType: "touch" });
    fireEvent.click(share);
    expect(share).toHaveAttribute("aria-expanded", "false");
  });

  it("ignores touch hover", () => {
    vi.useFakeTimers();
    render(<Fixture items={nested} />);
    fireEvent.click(trigger());
    fireEvent.pointerEnter(item("Share"), { pointerType: "touch" });
    act(() => vi.advanceTimersByTime(500));
    expect(item("Share")).toHaveAttribute("aria-expanded", "false");
  });
});

describe("React DropdownMenu inside a dialog (ADR 0016)", () => {
  it("renders the menu inside the open dialog", async () => {
    const user = userEvent.setup();
    render(
      <Dialog title="Settings" open>
        <Fixture items={nested} />
      </Dialog>,
    );
    await user.click(trigger());
    const dialog = screen.getByRole("dialog");
    expect(dialog).toContainElement(screen.getByRole("menu"));
  });

  it("hands focus to the trigger before an item opens a dialog", async () => {
    const user = userEvent.setup();
    let focused: Element | null = null;
    render(
      <Fixture
        items={nested}
        onSelect={() => {
          focused = document.activeElement;
        }}
      />,
    );
    await user.click(trigger());
    await user.click(item("Rename"));
    expect(focused).toBe(trigger());
  });
});
