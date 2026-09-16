import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Sidebar, type SidebarSection } from "./Sidebar";

const sections: SidebarSection[] = [
  {
    label: "Main",
    items: [
      { value: "home", label: "Home" },
      { value: "search", label: "Search" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    collapsible: true,
    items: [
      { value: "daily", label: "Daily", href: "/daily" },
      { value: "weekly", label: "Weekly", href: "/weekly" },
    ],
  },
];

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

  it("puts a glyph in the rail toggle and the section chevron", () => {
    const { container } = render(Sidebar, { props: { sections, onCollapsedChange: () => {} } });
    // An empty <svg> is not a glyph: the shape inside it is.
    expect(container.querySelector(".sidebar__rail-toggle svg > *")).not.toBeNull();
    expect(container.querySelector(".sidebar__chevron svg > *")).not.toBeNull();
  });
});
