import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Sidebar, type SidebarProps, type SidebarSection } from "./Sidebar";

const dot = (
  <svg viewBox="0 0 24 24" width="1em" height="1em">
    <circle cx="12" cy="12" r="4" />
  </svg>
);

const withIcons: SidebarSection[] = [
  {
    label: "Main",
    items: [
      { value: "home", label: "Home", icon: dot },
      { value: "search", label: "Search", icon: dot },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    collapsible: true,
    items: [
      { value: "daily", label: "Daily", href: "/daily", icon: dot },
      { value: "weekly", label: "Weekly", href: "/weekly", icon: dot },
    ],
  },
];
const withoutIcons = withIcons.map((section) => ({
  ...section,
  items: section.items.map(({ icon: _icon, ...item }) => item),
})) as SidebarSection[];
const moved: SidebarSection[] = [
  { label: "Main", items: [{ value: "search", label: "Search", icon: dot }] },
  {
    id: "reports",
    label: "Reports",
    collapsible: true,
    items: [
      { value: "home", label: "Home", icon: dot },
      { value: "daily", label: "Daily", href: "/daily", icon: dot },
    ],
  },
];
const duplicates: SidebarSection[] = [
  { id: "tools-a", label: "Tools", collapsible: true, items: [{ value: "a", label: "A" }] },
  { id: "tools-b", label: "Tools", collapsible: true, items: [{ value: "b", label: "B" }] },
];

const Fixture = (props: Partial<SidebarProps>) => (
  <Sidebar sections={withIcons} value="home" {...props} />
);
const nav = () => screen.getByRole("navigation");
const group = (name = "Reports") => screen.getByRole("button", { name });
const toggle = () => screen.getByRole("button", { name: "Collapse the navigation" });

describe("React Sidebar", () => {
  it("is a labelled navigation landmark of links and buttons", () => {
    render(<Fixture />);
    expect(nav()).toHaveAttribute("aria-label", "Main");
    // Navigation, not a menu: destinations are links and buttons in a list,
    // with no menu roles and nothing taken out of the tab order.
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBeGreaterThan(0);
    for (const entry of items) {
      const control = entry.querySelector("a, button")!;
      expect(control.getAttribute("role")).toBeNull();
      expect(control.hasAttribute("tabindex")).toBe(false);
    }
    expect(screen.getByRole("button", { name: "Home" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Home" })).toHaveAttribute("data-current", "");
    expect(screen.getByRole("button", { name: "Search" })).not.toHaveAttribute("aria-current");
  });

  it("reports an activated item once", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Fixture onSelect={onSelect} />);
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(onSelect).toHaveBeenCalledWith("search");
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Fixture />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("React Sidebar sections", () => {
  it("opens the section holding the current item, and leaves the others closed", () => {
    const { unmount } = render(<Fixture value="daily" />);
    expect(group()).toHaveAttribute("aria-expanded", "true");
    unmount();
    render(<Fixture />);
    expect(group()).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the section when the current item moves into it, silently", () => {
    const onOpenGroupsChange = vi.fn();
    const { rerender } = render(<Fixture onOpenGroupsChange={onOpenGroupsChange} />);
    rerender(<Fixture value="weekly" onOpenGroupsChange={onOpenGroupsChange} />);
    expect(group()).toHaveAttribute("aria-expanded", "true");
    expect(onOpenGroupsChange).not.toHaveBeenCalled();
  });

  it("reports a press, and answers it, while nobody controls the set", async () => {
    const user = userEvent.setup();
    const onOpenGroupsChange = vi.fn();
    render(<Fixture onOpenGroupsChange={onOpenGroupsChange} />);
    await user.click(group());
    expect(group()).toHaveAttribute("aria-expanded", "true");
    expect(onOpenGroupsChange).toHaveBeenCalledWith(["reports"]);
    expect(onOpenGroupsChange).toHaveBeenCalledTimes(1);
  });

  it("leaves the set to the application when it is controlled", async () => {
    const user = userEvent.setup();
    const onOpenGroupsChange = vi.fn();
    const { rerender } = render(
      <Fixture openGroups={[]} onOpenGroupsChange={onOpenGroupsChange} />,
    );
    await user.click(group());
    expect(onOpenGroupsChange).toHaveBeenCalledWith(["reports"]);
    expect(group(), "a controlled set moves only when the application moves it").toHaveAttribute(
      "aria-expanded",
      "false",
    );
    rerender(<Fixture openGroups={[]} value="weekly" onOpenGroupsChange={onOpenGroupsChange} />);
    expect(group()).toHaveAttribute("aria-expanded", "false");
    expect(onOpenGroupsChange).toHaveBeenCalledTimes(1);
  });

  it("opens two sections that share a label independently", async () => {
    const user = userEvent.setup();
    const onOpenGroupsChange = vi.fn();
    render(<Sidebar sections={duplicates} onOpenGroupsChange={onOpenGroupsChange} />);
    const [first, second] = screen.getAllByRole("button", { name: "Tools" });
    await user.click(first!);
    expect(onOpenGroupsChange).toHaveBeenCalledWith(["tools-a"]);
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(second).toHaveAttribute("aria-expanded", "false");
  });

  it("refuses two collapsible sections with the same id, or none", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const same = duplicates.map((section) => ({ ...section, id: "tools" })) as SidebarSection[];
    expect(() => render(<Sidebar sections={same} />)).toThrow(/share the id "tools"/);
    const noId = [{ label: "Tools", collapsible: true, items: [] }] as unknown as SidebarSection[];
    expect(() => render(<Sidebar sections={noId} />)).toThrow(
      /collapsible sidebar section needs an id/,
    );
    error.mockRestore();
  });

  it("still takes plain sections with no ids, icons or groups", () => {
    render(
      <Sidebar
        sections={[
          { label: "Main", items: [{ value: "inbox", label: "Inbox" }] },
          { items: [{ value: "settings", label: "Settings", href: "/settings" }] },
        ]}
        onCollapsedChange={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Inbox" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /the navigation/i })).toBeNull();
  });

  it("renders the logo and footer only when given", () => {
    const { container, rerender } = render(<Fixture />);
    expect(container.querySelector(".sidebar__logo")).toBeNull();
    expect(container.querySelector(".sidebar__footer")).toBeNull();
    rerender(<Fixture logo={<span>Brand</span>} footer={<span>Signed in</span>} />);
    expect(screen.getByText("Brand")).toBeInTheDocument();
    expect(screen.getByText("Signed in")).toBeInTheDocument();
  });
});

describe("React Sidebar rail", () => {
  it("renders no toggle unless the application asked for one", () => {
    render(<Fixture />);
    expect(screen.queryByRole("button", { name: /navigation/i })).toBeNull();
  });

  it("presses as a toggle with one name, and reports through aria-pressed", async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    const { rerender } = render(<Fixture onCollapsedChange={onCollapsedChange} />);
    expect(toggle()).toHaveAttribute("aria-pressed", "false");
    await user.click(toggle());
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    expect(onCollapsedChange).toHaveBeenCalledTimes(1);
    expect(toggle()).toHaveAttribute("aria-pressed", "true");

    rerender(<Fixture collapsed={false} onCollapsedChange={onCollapsedChange} />);
    rerender(<Fixture collapsed onCollapsedChange={onCollapsedChange} />);
    // The name stays put; the pressed state says which way the rail is.
    expect(toggle()).toHaveAttribute("aria-pressed", "true");
    expect(nav()).toHaveAttribute("data-collapsed", "");
  });

  it("keeps every destination's name while the labels are out of sight", () => {
    const { container } = render(<Fixture collapsed value="daily" />);
    expect(screen.getByRole("button", { name: "Home" })).toBeInTheDocument();
    expect(container.querySelectorAll(".sidebar__item .sidebar__label--hidden").length).toBe(4);
    const current = screen.getByRole("link", { name: "Daily" });
    expect(current).toHaveAttribute("aria-current", "page");
    for (const item of container.querySelectorAll(".sidebar__item")) {
      expect(item.querySelector("svg"), "a destination with nothing to show").not.toBeNull();
    }
  });

  it("gives a name back on the rail through a tooltip", async () => {
    vi.useFakeTimers();
    try {
      render(<Fixture collapsed />);
      act(() => screen.getByRole("button", { name: "Search" }).focus());
      expect(screen.getByRole("tooltip")).toHaveTextContent("Search");
    } finally {
      vi.useRealTimers();
    }
  });

  it("expands the bar and opens the section, in one press", async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    const onOpenGroupsChange = vi.fn();
    render(
      <Fixture
        collapsed
        onCollapsedChange={onCollapsedChange}
        onOpenGroupsChange={onOpenGroupsChange}
      />,
    );
    await user.click(group());
    expect(onCollapsedChange).toHaveBeenCalledWith(false);
    expect(onCollapsedChange).toHaveBeenCalledTimes(1);
    expect(onOpenGroupsChange).toHaveBeenCalledWith(["reports"]);
    expect(onOpenGroupsChange).toHaveBeenCalledTimes(1);
    expect(group()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Daily" })).toBeVisible();
  });

  it("offers no rail without an icon on every destination", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { unmount } = render(<Sidebar sections={withoutIcons} onCollapsedChange={() => {}} />);
    expect(screen.queryByRole("button", { name: /the navigation/i })).toBeNull();
    unmount();
    // Development says why; production keeps the sidebar usable.
    expect(() => render(<Sidebar sections={withoutIcons} collapsed />)).toThrow(
      /needs an icon on every destination/,
    );
    error.mockRestore();
  });
});

describe("React Sidebar as a drawer", () => {
  const openDrawer = (user: ReturnType<typeof userEvent.setup>) =>
    user.click(screen.getByRole("button", { name: "Open the navigation" }));

  it("puts the navigation in a dialog, named and dismissable", async () => {
    const user = userEvent.setup();
    render(<Fixture mode="drawer" />);
    expect(screen.queryByRole("navigation"), "closed, there is nothing to navigate").toBeNull();
    await openDrawer(user);
    expect(screen.getByRole("dialog")).toHaveAccessibleName("Main");
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("closes when a destination is followed, and reports it once", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Fixture mode="drawer" onOpenChange={onOpenChange} />);
    await openDrawer(user);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });

  it("stays open when following does not close it", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Fixture mode="drawer" closeOnNavigate={false} onOpenChange={onOpenChange} />);
    await openDrawer(user);
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("leaves the rail alone in a drawer, where there is none", async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    const onOpenGroupsChange = vi.fn();
    render(
      <Sidebar
        sections={withoutIcons}
        mode="drawer"
        collapsed
        onCollapsedChange={onCollapsedChange}
        onOpenGroupsChange={onOpenGroupsChange}
      />,
    );
    await openDrawer(user);
    expect(screen.queryByRole("button", { name: /Collapse/ })).toBeNull();
    await user.click(group());
    expect(onCollapsedChange).not.toHaveBeenCalled();
    expect(onOpenGroupsChange).toHaveBeenCalledWith(["reports"]);
  });

  it("renders no trigger of its own, and hands focus to the named button", () => {
    const opener = document.createElement("button");
    opener.id = "opener";
    document.body.appendChild(opener);
    const elsewhere = document.createElement("button");
    document.body.appendChild(elsewhere);
    elsewhere.focus();

    const props = { mode: "drawer" as const, renderTrigger: false, returnFocusTo: "#opener" };
    const { rerender } = render(<Fixture {...props} />);
    expect(screen.queryByRole("button", { name: "Open the navigation" })).toBeNull();
    rerender(<Fixture {...props} open />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    rerender(<Fixture {...props} open={false} />);
    expect(document.activeElement).toBe(opener);
    opener.remove();
    elsewhere.remove();
  });
});

describe("React Sidebar when the sections change or the set is handed back", () => {
  it("opens the section the current destination moved into, silently", () => {
    const onOpenGroupsChange = vi.fn();
    const { rerender } = render(<Fixture onOpenGroupsChange={onOpenGroupsChange} />);
    expect(group()).toHaveAttribute("aria-expanded", "false");
    rerender(<Fixture sections={moved} onOpenGroupsChange={onOpenGroupsChange} />);
    expect(group()).toHaveAttribute("aria-expanded", "true");
    expect(onOpenGroupsChange).not.toHaveBeenCalled();
  });

  it("moves nothing and reports nothing while the set is controlled", () => {
    const onOpenGroupsChange = vi.fn();
    const { rerender } = render(
      <Fixture openGroups={[]} onOpenGroupsChange={onOpenGroupsChange} />,
    );
    rerender(<Fixture sections={moved} openGroups={[]} onOpenGroupsChange={onOpenGroupsChange} />);
    expect(group()).toHaveAttribute("aria-expanded", "false");
    expect(onOpenGroupsChange).not.toHaveBeenCalled();
  });

  it("keeps the set that was on screen", () => {
    const controlled = ["reports"];
    const { rerender } = render(<Fixture openGroups={controlled} />);
    expect(group()).toHaveAttribute("aria-expanded", "true");
    rerender(<Fixture openGroups={undefined} />);
    expect(group()).toHaveAttribute("aria-expanded", "true");
  });

  it("brings back nothing the application refused, after a press", async () => {
    const user = userEvent.setup();
    const onOpenGroupsChange = vi.fn();
    const controlled: string[] = [];
    const { rerender } = render(
      <Fixture openGroups={controlled} onOpenGroupsChange={onOpenGroupsChange} />,
    );
    await user.click(group());
    expect(onOpenGroupsChange).toHaveBeenCalledWith(["reports"]);
    rerender(<Fixture openGroups={undefined} onOpenGroupsChange={onOpenGroupsChange} />);
    expect(group()).toHaveAttribute("aria-expanded", "false");
  });

  it("brings back nothing the current destination opened while controlled", () => {
    const onOpenGroupsChange = vi.fn();
    const controlled: string[] = [];
    const { rerender } = render(
      <Fixture openGroups={controlled} onOpenGroupsChange={onOpenGroupsChange} />,
    );
    rerender(
      <Fixture value="daily" openGroups={controlled} onOpenGroupsChange={onOpenGroupsChange} />,
    );
    expect(group()).toHaveAttribute("aria-expanded", "false");
    rerender(
      <Fixture value="daily" openGroups={undefined} onOpenGroupsChange={onOpenGroupsChange} />,
    );
    expect(group()).toHaveAttribute("aria-expanded", "false");
    expect(onOpenGroupsChange).not.toHaveBeenCalled();
  });
});
