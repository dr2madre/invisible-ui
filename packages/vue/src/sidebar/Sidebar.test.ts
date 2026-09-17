import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { h, markRaw } from "vue";
import { Sidebar, type SidebarSection } from "./Sidebar";

// A destination's icon: the rail needs every destination to show something
// once the labels are out of sight.
const Dot = markRaw({
  name: "Dot",
  render: () =>
    h("svg", { viewBox: "0 0 24 24", width: 16, height: 16, "aria-hidden": "true" }, [
      h("circle", { cx: 12, cy: 12, r: 8, fill: "currentColor" }),
    ]),
});

const sections: SidebarSection[] = [
  {
    label: "Main",
    items: [
      { value: "home", label: "Home", icon: Dot },
      { value: "search", label: "Search", icon: Dot },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    collapsible: true,
    items: [
      { value: "daily", label: "Daily", href: "/daily", icon: Dot },
      { value: "weekly", label: "Weekly", href: "/weekly", icon: Dot },
    ],
  },
];

const withoutIcons: SidebarSection[] = sections.map((section) => ({
  ...section,
  items: section.items.map(({ icon: _icon, ...item }) => item),
})) as SidebarSection[];

const mount = (props: Record<string, unknown> = {}) =>
  render(Sidebar, { props: { sections, value: "home", ...props } });

const group = () => screen.getByRole("button", { name: "Reports" });

describe("Vue Sidebar", () => {
  it("is a labelled navigation landmark of links and buttons", () => {
    mount();
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
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
    expect(screen.getByRole("button", { name: "Search" })).not.toHaveAttribute("aria-current");
  });

  it("reports an activated item once", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    mount({ onSelect });
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(onSelect).toHaveBeenCalledWith("search");
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("has no accessibility violations", async () => {
    const { container } = mount();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Vue Sidebar sections", () => {
  it("opens the section holding the current item, and leaves the others closed", () => {
    mount({ value: "daily" });
    expect(group()).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps a section closed when nothing in it is current", () => {
    mount();
    expect(group()).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the section when the current item moves into it, silently", async () => {
    const onOpenGroupsChange = vi.fn();
    const { rerender } = mount({ onOpenGroupsChange });
    expect(group()).toHaveAttribute("aria-expanded", "false");

    await rerender({ sections, value: "weekly", onOpenGroupsChange });
    expect(group(), "the current item must not be hidden inside a closed section").toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(
      onOpenGroupsChange,
      "a change of the current item is not the user opening a section",
    ).not.toHaveBeenCalled();
  });

  it("reports a press, and answers it, while nobody controls the set", async () => {
    const user = userEvent.setup();
    const onOpenGroupsChange = vi.fn();
    mount({ onOpenGroupsChange });

    await user.click(group());
    expect(group()).toHaveAttribute("aria-expanded", "true");
    expect(onOpenGroupsChange).toHaveBeenCalledWith(["reports"]);
    expect(onOpenGroupsChange).toHaveBeenCalledTimes(1);
  });

  it("leaves the set to the application when it is controlled", async () => {
    const user = userEvent.setup();
    const onOpenGroupsChange = vi.fn();
    const { rerender } = mount({ openGroups: [], onOpenGroupsChange });

    await user.click(group());
    expect(onOpenGroupsChange).toHaveBeenCalledWith(["reports"]);
    expect(group(), "a controlled set moves only when the application moves it").toHaveAttribute(
      "aria-expanded",
      "false",
    );

    await rerender({ sections, openGroups: [], onOpenGroupsChange, value: "weekly" });
    expect(group()).toHaveAttribute("aria-expanded", "false");
    expect(onOpenGroupsChange).toHaveBeenCalledTimes(1);
  });
});

describe("Vue Sidebar rail", () => {
  const toggle = () => screen.getByRole("button", { name: /the navigation/i });

  it("renders no toggle unless the application asked for one", () => {
    mount();
    expect(screen.queryByRole("button", { name: /the navigation/i })).toBeNull();
  });

  it("presses as a toggle, and says which way it goes", async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    const { rerender } = mount({ onCollapsedChange });

    expect(toggle()).toHaveAttribute("aria-pressed", "false");
    await user.click(toggle());
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    expect(onCollapsedChange).toHaveBeenCalledTimes(1);

    await rerender({ sections, value: "home", onCollapsedChange, collapsed: true });
    expect(toggle()).toHaveAttribute("aria-pressed", "true");
    expect(toggle()).toHaveAccessibleName("Expand the navigation");
  });

  it("keeps every destination's name while the labels are out of sight", () => {
    const { container } = mount({ collapsed: true, value: "daily" });
    expect(screen.getByRole("button", { name: "Home" })).toBeInTheDocument();
    const current = screen.getByRole("link", { name: "Daily" });
    expect(current, "the rail still says which destination you are on").toHaveAttribute(
      "aria-current",
      "page",
    );
    // Out of sight is the whole point of the rail: the class that takes the
    // name off the page is how, and the names above prove it is still read.
    expect(
      container.querySelectorAll(".sidebar__item .sidebar__label--hidden").length,
      "the names are still taking room",
    ).toBeGreaterThan(0);
    expect(container.querySelector(".sidebar__item .sidebar__label")).toBeNull();
  });

  it("opens the bar before the section, when a section is pressed collapsed", async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    const onOpenGroupsChange = vi.fn();
    mount({ collapsed: true, onCollapsedChange, onOpenGroupsChange });

    await user.click(group());
    expect(
      onCollapsedChange,
      "the items need the width before they are shown",
    ).toHaveBeenCalledWith(false);
    expect(onOpenGroupsChange).toHaveBeenCalledWith(["reports"]);
  });
});

describe("Vue Sidebar as a drawer", () => {
  const openDrawer = (user: ReturnType<typeof userEvent.setup>) =>
    user.click(screen.getByRole("button", { name: "Open the navigation" }));

  it("puts the navigation in a dialog, named and dismissable", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = mount({ mode: "drawer", onOpenChange });
    expect(screen.queryByRole("navigation"), "closed, there is nothing to navigate").toBeNull();

    await openDrawer(user);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    await rerender({ sections, value: "home", mode: "drawer", onOpenChange, open: true });
    expect(screen.getByRole("dialog")).toHaveAccessibleName("Main");
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("closes when a destination is followed, and reports it once", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = mount({ mode: "drawer", onOpenChange });

    await openDrawer(user);
    await rerender({ sections, value: "home", mode: "drawer", onOpenChange, open: true });
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });

  it("stays open when the application says following does not close it", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = mount({ mode: "drawer", closeOnNavigate: false, onOpenChange });

    await openDrawer(user);
    await rerender({
      sections,
      value: "home",
      mode: "drawer",
      closeOnNavigate: false,
      onOpenChange,
      open: true,
    });
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders no trigger of its own, and hands focus to the named button", async () => {
    const opener = document.createElement("button");
    opener.id = "opener";
    document.body.appendChild(opener);
    // Focus is elsewhere when the drawer opens, so only the named element can
    // be where it comes back to.
    const elsewhere = document.createElement("button");
    document.body.appendChild(elsewhere);
    elsewhere.focus();

    const props = {
      sections,
      value: "home",
      mode: "drawer",
      renderTrigger: false,
      returnFocusTo: "#opener",
    };
    const { rerender } = render(Sidebar, { props });
    expect(screen.queryByRole("button", { name: "Open the navigation" })).toBeNull();

    await rerender({ ...props, open: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("navigation")).toBeInTheDocument();

    await rerender({ ...props, open: false });
    expect(document.activeElement, "focus went back to the named button").toBe(opener);
    opener.remove();
    elsewhere.remove();
  });
});

// The same edges review found in the Svelte adapter, held here too.
describe("Vue Sidebar, the edges review found", () => {
  it("closes the drawer it opened itself when a destination is followed", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    // No `open` binding: the drawer's own trigger owns it, and following a
    // destination still has to close it.
    render(Sidebar, { props: { sections, mode: "drawer", onOpenChange } });

    await user.click(screen.getByRole("button", { name: "Open the navigation" }));
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("answers the rail toggle itself, and reports it once", async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    render(Sidebar, { props: { sections, onCollapsedChange } });
    const toggle = screen.getByRole("button", { name: /the navigation/i });

    await user.click(toggle);
    expect(toggle, "the control moves on its own press").toHaveAttribute("aria-pressed", "true");
    expect(onCollapsedChange).toHaveBeenCalledTimes(1);
  });

  it("leaves the rail alone in a drawer, where there is none", async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    const onOpenGroupsChange = vi.fn();
    render(Sidebar, {
      props: { sections, mode: "drawer", collapsed: true, onCollapsedChange, onOpenGroupsChange },
    });

    await user.click(screen.getByRole("button", { name: "Open the navigation" }));
    await user.click(group());

    expect(onCollapsedChange, "a drawer has no rail to expand").not.toHaveBeenCalled();
    expect(onOpenGroupsChange).toHaveBeenCalledWith(["reports"]);
  });

  it("expands the bar and opens the section, in one press", async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    const onOpenGroupsChange = vi.fn();
    render(Sidebar, {
      props: { sections, value: "home", collapsed: true, onCollapsedChange, onOpenGroupsChange },
    });

    await user.click(group());
    expect(onCollapsedChange).toHaveBeenCalledTimes(1);
    expect(onOpenGroupsChange).toHaveBeenCalledWith(["reports"]);
    // And both actually happened, not merely reported.
    expect(group()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Daily" })).toBeVisible();
  });

  it("renders two sections that share a label", () => {
    render(Sidebar, {
      props: {
        sections: [
          { label: "Tools", items: [{ value: "a", label: "A" }] },
          { label: "Tools", items: [{ value: "b", label: "B" }] },
        ],
      },
    });
    expect(screen.getAllByText("Tools")).toHaveLength(2);
  });

  it("puts a glyph on every destination in the rail", () => {
    const { container } = render(Sidebar, { props: { sections, collapsed: true } });
    const items = [...container.querySelectorAll(".sidebar__item")];
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.querySelector("svg"), "a destination with nothing to show").not.toBeNull();
    }
  });

  it("puts a glyph in the rail toggle and the section chevron", () => {
    const { container } = render(Sidebar, { props: { sections, onCollapsedChange: () => {} } });
    // An empty <svg> is not a glyph: the shape inside it is.
    expect(container.querySelector(".sidebar__rail-toggle svg > *")).not.toBeNull();
    expect(container.querySelector(".sidebar__chevron svg > *")).not.toBeNull();
  });
});

// A rail shows icons. A destination with none would show nothing at all, so
// the rail is only offered when every destination carries one (ADR 0013).
describe("Vue Sidebar without an icon on every destination", () => {
  it("says nothing about a rail in a drawer, where there is none", async () => {
    const user = userEvent.setup();
    // A page that keeps one collapsed flag across breakpoints narrows to a
    // drawer: there is no rail to refuse, so there is nothing to say.
    render(Sidebar, {
      props: { sections: withoutIcons, mode: "drawer", collapsed: true },
    });
    await user.click(screen.getByRole("button", { name: "Open the navigation" }));
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Home" })).toBeInTheDocument();
  });

  it("renders no rail toggle at all", () => {
    render(Sidebar, { props: { sections: withoutIcons, onCollapsedChange: () => {} } });
    expect(screen.queryByRole("button", { name: /the navigation/i })).toBeNull();
  });

  it("says why, and keeps the sidebar usable, when asked to collapse", () => {
    expect(() => render(Sidebar, { props: { sections: withoutIcons, collapsed: true } })).toThrow(
      /needs an icon on every destination/,
    );
  });

  it("offers the rail as soon as every destination shows something", () => {
    render(Sidebar, { props: { sections, onCollapsedChange: () => {} } });
    expect(screen.getByRole("button", { name: /the navigation/i })).toBeInTheDocument();
  });
});

// A label is not an identity: the id is what a section answers to in
// `openGroups` (ADR 0013).
describe("Vue Sidebar section identity", () => {
  const twins: SidebarSection[] = [
    { id: "tools-a", label: "Tools", collapsible: true, items: [{ value: "a", label: "A" }] },
    { id: "tools-b", label: "Tools", collapsible: true, items: [{ value: "b", label: "B" }] },
  ];

  it("opens two sections that share a label independently", async () => {
    const user = userEvent.setup();
    const onOpenGroupsChange = vi.fn();
    render(Sidebar, { props: { sections: twins, onOpenGroupsChange } });
    const [first, second] = screen.getAllByRole("button", { name: "Tools" });

    await user.click(first!);
    expect(onOpenGroupsChange).toHaveBeenCalledWith(["tools-a"]);
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(second, "the other section opened with it").toHaveAttribute("aria-expanded", "false");
  });

  it("refuses two collapsible sections with the same id", () => {
    expect(() =>
      render(Sidebar, {
        props: {
          sections: [
            { id: "tools", label: "Tools", collapsible: true, items: [{ value: "a", label: "A" }] },
            { id: "tools", label: "Tools", collapsible: true, items: [{ value: "b", label: "B" }] },
          ],
        },
      }),
    ).toThrow(/share the id "tools"/);
    document.body.innerHTML = "";
  });

  it("refuses a collapsible section with no id", () => {
    expect(() =>
      render(Sidebar, {
        props: {
          sections: [{ label: "Tools", collapsible: true, items: [{ value: "a", label: "A" }] }],
        },
      }),
    ).toThrow(/collapsible sidebar section needs an id/);
    document.body.innerHTML = "";
  });

  it("still takes the plain sections the former name shipped", () => {
    // No ids, nothing collapsible, no icons: exactly what Menu accepted.
    const legacy: SidebarSection[] = [
      { label: "Main", items: [{ value: "inbox", label: "Inbox" }] },
      { items: [{ value: "settings", label: "Settings", href: "/settings" }] },
    ];
    render(Sidebar, { props: { sections: legacy } });
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inbox" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /the navigation/i })).toBeNull();
  });
});

describe("Vue Sidebar when the sections themselves change", () => {
  // The current destination does not move; the sections do, and it is now
  // inside the collapsible one.
  const moved: SidebarSection[] = [
    { label: "Main", items: [{ value: "search", label: "Search", icon: Dot }] },
    {
      id: "reports",
      label: "Reports",
      collapsible: true,
      items: [
        { value: "home", label: "Home", icon: Dot },
        { value: "daily", label: "Daily", href: "/daily", icon: Dot },
      ],
    },
  ];

  it("opens the section the current destination moved into, silently", async () => {
    const onOpenGroupsChange = vi.fn();
    const { rerender } = render(Sidebar, {
      props: { sections, value: "home", onOpenGroupsChange },
    });
    expect(group()).toHaveAttribute("aria-expanded", "false");

    await rerender({ sections: moved, value: "home", onOpenGroupsChange });
    expect(group(), "the current destination was left inside a closed section").toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(
      onOpenGroupsChange,
      "moving the sections is not the user opening one",
    ).not.toHaveBeenCalled();
  });

  it("moves nothing and reports nothing while the set is controlled", async () => {
    const onOpenGroupsChange = vi.fn();
    const { rerender } = render(Sidebar, {
      props: { sections, value: "home", openGroups: [], onOpenGroupsChange },
    });

    await rerender({ sections: moved, value: "home", openGroups: [], onOpenGroupsChange });
    expect(group()).toHaveAttribute("aria-expanded", "false");
    expect(onOpenGroupsChange).not.toHaveBeenCalled();
  });
});

describe("Vue Sidebar when the application stops controlling the set", () => {
  it("keeps the set that was on screen", async () => {
    const onOpenGroupsChange = vi.fn();
    // One array, held by the application and never replaced: the ordinary
    // shape, and the one a fresh literal per render would hide.
    const controlled = ["reports"];
    const { rerender } = render(Sidebar, {
      props: { sections, value: "home", openGroups: controlled, onOpenGroupsChange },
    });
    expect(group()).toHaveAttribute("aria-expanded", "true");

    await rerender({ sections, value: "home", openGroups: undefined, onOpenGroupsChange });
    expect(group()).toHaveAttribute("aria-expanded", "true");
    expect(onOpenGroupsChange).not.toHaveBeenCalled();
  });

  it("brings back nothing the application refused, after a press", async () => {
    const user = userEvent.setup();
    const onOpenGroupsChange = vi.fn();
    const controlled: string[] = [];
    const { rerender } = render(Sidebar, {
      props: { sections, value: "home", openGroups: controlled, onOpenGroupsChange },
    });

    await user.click(group());
    expect(onOpenGroupsChange).toHaveBeenCalledWith(["reports"]);
    expect(group()).toHaveAttribute("aria-expanded", "false");

    await rerender({ sections, value: "home", openGroups: undefined, onOpenGroupsChange });
    expect(group(), "a section the application refused opened after the handback").toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("brings back nothing the current destination opened while controlled", async () => {
    const onOpenGroupsChange = vi.fn();
    const controlled: string[] = [];
    const { rerender } = render(Sidebar, {
      props: { sections, value: "home", openGroups: controlled, onOpenGroupsChange },
    });

    await rerender({ sections, value: "daily", openGroups: controlled, onOpenGroupsChange });
    expect(group()).toHaveAttribute("aria-expanded", "false");

    await rerender({ sections, value: "daily", openGroups: undefined, onOpenGroupsChange });
    expect(group(), "a section opened that the application had kept closed").toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(onOpenGroupsChange).not.toHaveBeenCalled();
  });
});
