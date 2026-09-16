import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./sidebar.fixture.svelte";

const nav = () => screen.getByRole("navigation");

describe("Sidebar", () => {
  it("is a labelled navigation landmark of links and buttons", () => {
    render(Fixture);
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
    expect(screen.getByRole("button", { name: "Search" })).not.toHaveAttribute("aria-current");
  });

  it("reports an activated item once, and marks the current one", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(Fixture, { props: { onSelect } });
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(onSelect).toHaveBeenCalledWith("search");
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Sidebar sections", () => {
  const group = () => screen.getByRole("button", { name: "Reports" });

  it("opens the section holding the current item, and leaves the others closed", () => {
    render(Fixture, { props: { value: "daily" } });
    expect(group()).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps a section closed when nothing in it is current", () => {
    render(Fixture);
    expect(group()).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the section when the current item moves into it, silently", async () => {
    const onOpenGroupsChange = vi.fn();
    const { rerender } = render(Fixture, { props: { onOpenGroupsChange } });
    expect(group()).toHaveAttribute("aria-expanded", "false");

    await rerender({ value: "weekly", onOpenGroupsChange });
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
    render(Fixture, { props: { onOpenGroupsChange } });

    await user.click(group());
    expect(group()).toHaveAttribute("aria-expanded", "true");
    expect(onOpenGroupsChange).toHaveBeenCalledWith(["reports"]);
    expect(onOpenGroupsChange).toHaveBeenCalledTimes(1);
  });

  it("leaves the set to the application when it is controlled", async () => {
    const user = userEvent.setup();
    const onOpenGroupsChange = vi.fn();
    const { rerender } = render(Fixture, { props: { openGroups: [], onOpenGroupsChange } });

    await user.click(group());
    expect(onOpenGroupsChange).toHaveBeenCalledWith(["reports"]);
    expect(group(), "a controlled set moves only when the application moves it").toHaveAttribute(
      "aria-expanded",
      "false",
    );

    // And a change of the current item moves nothing, and reports nothing.
    await rerender({ openGroups: [], onOpenGroupsChange, value: "weekly" });
    expect(group()).toHaveAttribute("aria-expanded", "false");
    expect(onOpenGroupsChange).toHaveBeenCalledTimes(1);
  });
});

describe("Sidebar rail", () => {
  it("renders no toggle unless the application asked for one", () => {
    render(Fixture);
    expect(screen.queryByRole("button", { name: /navigation/i })).toBeNull();
  });

  it("presses as a toggle, and says which way it goes", async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    const { rerender } = render(Fixture, { props: { onCollapsedChange } });
    const toggle = () => screen.getByRole("button", { name: /the navigation/i });

    expect(toggle()).toHaveAttribute("aria-pressed", "false");
    await user.click(toggle());
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    expect(onCollapsedChange).toHaveBeenCalledTimes(1);

    await rerender({ onCollapsedChange, collapsed: true });
    expect(toggle()).toHaveAttribute("aria-pressed", "true");
    expect(toggle()).toHaveAccessibleName("Expand the navigation");
  });

  it("keeps every destination's name while the labels are out of sight", () => {
    // The rail hides names from sight, never from a screen reader. The open
    // section proves it for links as well as buttons.
    const { container } = render(Fixture, { props: { collapsed: true, value: "daily" } });
    expect(screen.getByRole("button", { name: "Home" })).toBeInTheDocument();
    // Out of sight is the whole point of the rail: the class that takes the
    // name off the page is how, and the names prove it is still read.
    expect(
      container.querySelectorAll(".sidebar__item .sidebar__label--hidden").length,
      "the names are still taking room",
    ).toBeGreaterThan(0);
    const current = screen.getByRole("link", { name: "Daily" });
    expect(current).toBeInTheDocument();
    expect(current, "the rail still says which destination you are on").toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("opens the bar before the section, when a section is pressed collapsed", async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    const onOpenGroupsChange = vi.fn();
    render(Fixture, { props: { collapsed: true, onCollapsedChange, onOpenGroupsChange } });

    await user.click(screen.getByRole("button", { name: "Reports" }));
    expect(
      onCollapsedChange,
      "the items need the width before they are shown",
    ).toHaveBeenCalledWith(false);
    expect(onOpenGroupsChange).toHaveBeenCalledWith(["reports"]);
  });
});

describe("Sidebar as a drawer", () => {
  const openDrawer = async (user: ReturnType<typeof userEvent.setup>) =>
    user.click(screen.getByRole("button", { name: "Open the navigation" }));

  it("puts the navigation in a dialog, named and dismissable", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { mode: "drawer" } });
    expect(screen.queryByRole("navigation"), "closed, there is nothing to navigate").toBeNull();

    await openDrawer(user);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAccessibleName("Main");
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("closes when a destination is followed, and reports it once", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(Fixture, { props: { mode: "drawer", onOpenChange } });

    await openDrawer(user);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onOpenChange).toHaveBeenCalledTimes(2);
  });

  it("stays open when the application says following does not close it", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(Fixture, { props: { mode: "drawer", closeOnNavigate: false, onOpenChange } });

    await openDrawer(user);
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

    const onOpenChange = vi.fn();
    const props = { mode: "drawer", renderTrigger: false, returnFocusTo: "#opener", onOpenChange };
    const { rerender } = render(Fixture, { props });
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

// Six ways this went wrong before, each found by review and each reproduced
// here first.
describe("Sidebar, the edges review found", () => {
  it("renders two sections that share a label", () => {
    // The old Menu keyed its sections by position; keying by label instead
    // made a page with two "Tools" throw on render.
    render(Fixture, { props: { duplicateLabels: true } });
    expect(screen.getAllByText("Tools")).toHaveLength(2);
  });

  it("renders no empty logo or footer when neither slot was given", () => {
    const { container } = render(Fixture);
    expect(container.querySelector(".sidebar__logo"), "an empty logo box").toBeNull();
    expect(container.querySelector(".sidebar__footer"), "an empty footer rule").toBeNull();
  });

  it("renders the logo and footer when they are given", () => {
    render(Fixture, { props: { withSlots: true } });
    expect(screen.getByText("Brand")).toBeInTheDocument();
    expect(screen.getByText("Signed in")).toBeInTheDocument();
  });

  it("does not move a controlled section even for a moment", async () => {
    const user = userEvent.setup();
    const onOpenGroupsChange = vi.fn();
    render(Fixture, { props: { openGroups: [], onOpenGroupsChange } });
    const group = screen.getByRole("button", { name: "Reports" });

    // Read straight after the press, before anything settles: a section that
    // flips and flips back announces a state nobody asked for.
    group.click();
    expect(group, "the section moved before the application answered").toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await user.click(group);
    expect(group).toHaveAttribute("aria-expanded", "false");
  });

  it("leaves the rail alone in a drawer, where there is none", async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    const onOpenGroupsChange = vi.fn();
    render(Fixture, {
      props: { mode: "drawer", collapsed: true, onCollapsedChange, onOpenGroupsChange },
    });

    await user.click(screen.getByRole("button", { name: "Open the navigation" }));
    await user.click(screen.getByRole("button", { name: "Reports" }));

    expect(onCollapsedChange, "a drawer has no rail to expand").not.toHaveBeenCalled();
    expect(onOpenGroupsChange).toHaveBeenCalledWith(["reports"]);
  });

  it("expands the bar and opens the section, in one press", async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    const onOpenGroupsChange = vi.fn();
    const { rerender } = render(Fixture, {
      props: { collapsed: true, onCollapsedChange, onOpenGroupsChange },
    });

    await user.click(screen.getByRole("button", { name: "Reports" }));
    expect(onCollapsedChange).toHaveBeenCalledWith(false);
    expect(onCollapsedChange).toHaveBeenCalledTimes(1);
    expect(onOpenGroupsChange).toHaveBeenCalledWith(["reports"]);
    expect(onOpenGroupsChange).toHaveBeenCalledTimes(1);

    // And both actually happened, not merely reported.
    await rerender({ collapsed: false, onCollapsedChange, onOpenGroupsChange });
    expect(screen.getByRole("button", { name: "Reports" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("link", { name: "Daily" })).toBeVisible();
  });
});
