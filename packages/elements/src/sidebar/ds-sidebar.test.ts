import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import { trackModal } from "../internal/modal-stack";
import type { DsSidebar, SidebarSection } from "./ds-sidebar";

const HOME = "M3 12l9-9 9 9M5 10v10h14V10";
const sections: SidebarSection[] = [
  {
    items: [
      { value: "home", label: "Home", icon: HOME },
      { value: "sources", label: "Sources", icon: HOME, href: "#sources" },
    ],
  },
  {
    label: "Reports",
    collapsible: true,
    id: "reports",
    items: [{ value: "weekly", label: "Weekly", icon: HOME }],
  },
];

const mount = (attributes = "") => {
  document.body.innerHTML = `
    <ds-sidebar label="Primary" ${attributes}>
      <span slot="logo">Dromio</span>
      <span slot="footer">v1</span>
    </ds-sidebar>`;
  const sidebar = document.querySelector("ds-sidebar") as DsSidebar;
  sidebar.sections = sections;
  return sidebar;
};

describe("<ds-sidebar>", () => {
  it("renders a named navigation landmark with the logo, items and footer", () => {
    mount();
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(within(nav).getByText("Dromio").closest(".sidebar__logo")).not.toBeNull();
    expect(within(nav).getByRole("button", { name: "Home" })).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Sources" })).toHaveAttribute("href", "#sources");
    expect(within(nav).getByText("v1").closest(".sidebar__footer")).not.toBeNull();
  });

  it("keeps the footer content in place and focused across renders", () => {
    document.body.innerHTML = `
      <ds-sidebar label="Primary">
        <button slot="footer" type="button">Account</button>
      </ds-sidebar>`;
    const sidebar = document.querySelector("ds-sidebar") as DsSidebar;
    sidebar.sections = sections;
    const account = screen.getByRole("button", { name: "Account" });
    const region = account.parentElement;
    account.focus();
    sidebar.value = "weekly";
    expect(account).toHaveFocus();
    expect(account.parentElement).toBe(region);
    // The footer closes what shows; only the live region follows it.
    expect(region!.nextElementSibling).toHaveClass("sidebar__live");
    expect(region!.parentElement?.lastElementChild).toBe(region!.nextElementSibling);
  });

  it("marks the current destination and opens the section holding it", () => {
    mount('value="weekly"');
    expect(screen.getByRole("button", { name: "Weekly" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Reports" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("emits select for a button item and navigate for every item", async () => {
    const user = userEvent.setup();
    const sidebar = mount();
    const selected: string[] = [];
    const navigated: string[] = [];
    sidebar.addEventListener("select", (e) => selected.push((e as CustomEvent).detail.value));
    sidebar.addEventListener("navigate", (e) => navigated.push((e as CustomEvent).detail.value));
    await user.click(screen.getByRole("button", { name: "Home" }));
    await user.click(screen.getByRole("link", { name: "Sources" }));
    expect(selected).toEqual(["home"]);
    expect(navigated).toEqual(["home", "sources"]);
  });

  it("toggles a collapsible section, reports the open set and keeps focus on it", async () => {
    const user = userEvent.setup();
    const sidebar = mount();
    const reported: string[][] = [];
    sidebar.addEventListener("open-groups-change", (e) =>
      reported.push((e as CustomEvent).detail.openGroups),
    );
    await user.click(screen.getByRole("button", { name: "Reports" }));
    expect(screen.getByRole("button", { name: "Weekly" })).toBeVisible();
    expect(reported).toEqual([["reports"]]);
    expect(screen.getByRole("button", { name: "Reports" })).toHaveFocus();
  });

  it("collapses to a rail that keeps every name for assistive technology", async () => {
    const user = userEvent.setup();
    const sidebar = mount("rail-toggle");
    const seen: boolean[] = [];
    sidebar.addEventListener("collapsed-change", (e) =>
      seen.push((e as CustomEvent).detail.collapsed),
    );
    const toggle = () => screen.getByRole("button", { name: "Collapse the navigation" });
    expect(toggle()).toHaveAttribute("aria-pressed", "false");
    await user.click(toggle());
    expect(seen).toEqual([true]);
    expect(screen.getByRole("navigation")).toHaveAttribute("data-collapsed");
    expect(screen.getByRole("button", { name: "Home" })).toBeInTheDocument();
    // One name in both states: the pressed state alone says the rail is on.
    expect(toggle()).toHaveFocus();
    expect(toggle()).toHaveAttribute("aria-pressed", "true");
    await user.click(toggle());
    expect(seen).toEqual([true, false]);
    expect(toggle()).toHaveAttribute("aria-pressed", "false");
  });

  it("offers no rail when a destination has no icon", () => {
    document.body.innerHTML = `<ds-sidebar rail-toggle collapsed></ds-sidebar>`;
    const sidebar = document.querySelector("ds-sidebar") as DsSidebar;
    sidebar.sections = [{ items: [{ value: "home", label: "Home" }] }];
    expect(screen.queryByRole("button", { name: /the navigation/ })).toBeNull();
    expect(screen.getByRole("navigation")).not.toHaveAttribute("data-collapsed");
  });

  it("has no accessibility violations", async () => {
    mount('value="home"');
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe("<ds-sidebar> rail tooltips", () => {
  it("gives each destination its name back as a tooltip on the rail", async () => {
    const user = userEvent.setup();
    mount("collapsed");
    const home = screen.getByRole("button", { name: "Home" });
    expect(home.closest("ds-tooltip")).toHaveAttribute("text", "Home");
    home.focus();
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    await user.tab();
    expect(screen.getByRole("tooltip")).toHaveTextContent("Home");
  });

  it("renders no tooltip when the bar is expanded", () => {
    mount();
    expect(document.querySelector("ds-sidebar ds-tooltip")).toBeNull();
  });

  it("places the tooltip at the inline end, on the left in right-to-left text", () => {
    mount("collapsed");
    expect(document.querySelector("ds-sidebar ds-tooltip")).toHaveAttribute("placement", "right");
    document.documentElement.dir = "rtl";
    try {
      mount("collapsed");
      expect(document.querySelector("ds-sidebar ds-tooltip")).toHaveAttribute("placement", "left");
    } finally {
      document.documentElement.removeAttribute("dir");
    }
  });
});

describe("<ds-sidebar> badges and unavailable destinations", () => {
  // The Navigation Bar's destinations, passed unchanged.
  const status = (badge?: string, announce?: boolean): SidebarSection[] => [
    {
      items: [
        { value: "home", label: "Home", icon: HOME },
        {
          value: "inbox",
          label: "Inbox",
          icon: HOME,
          badge: badge === undefined ? undefined : { label: badge, content: "3", announce },
        },
        { value: "profile", label: "Profile", icon: HOME, badge: { label: "Needs attention" } },
        {
          value: "reports",
          label: "Reports",
          href: "#reports",
          icon: HOME,
          unavailable: { reason: "Ask an administrator for access" },
        },
      ],
    },
  ];
  const place = (given: SidebarSection[], attributes = "") => {
    document.body.innerHTML = `<ds-sidebar ${attributes}></ds-sidebar>`;
    const sidebar = document.querySelector("ds-sidebar") as DsSidebar;
    sidebar.sections = given;
    return sidebar;
  };
  const live = () => document.querySelector(".sidebar__live")!;

  it("reads the badge text inside the name and shows a count or a dot", () => {
    place(status("3 unread"));
    const inbox = screen.getByRole("button", { name: "Inbox, 3 unread" });
    expect(inbox.querySelector(".sidebar__badge")).toHaveTextContent("3");
    expect(inbox.querySelector(".sidebar__badge")).toHaveAttribute("aria-hidden", "true");
    const profile = screen.getByRole("button", { name: "Profile, Needs attention" });
    expect(profile.querySelector(".sidebar__badge--dot")).not.toBeNull();
  });

  it("keeps an unavailable destination focusable, with its reason shown and read", async () => {
    const user = userEvent.setup();
    const sidebar = place(status());
    const select = vi.fn();
    const navigate = vi.fn();
    sidebar.addEventListener("select", select);
    sidebar.addEventListener("navigate", navigate);
    const reports = screen.getByRole("link", { name: "Reports" });
    expect(reports).toHaveAttribute("aria-disabled", "true");
    expect(reports).toHaveAccessibleDescription("Ask an administrator for access");
    expect(reports.querySelector(".sidebar__status")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Ask an administrator for access")).toBeVisible();
    for (let step = 0; step < 4; step += 1) await user.tab();
    expect(reports).toHaveFocus();
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    reports.dispatchEvent(click);
    expect(click.defaultPrevented, "an unavailable link is not followed").toBe(true);
    expect(select).not.toHaveBeenCalled();
    expect(navigate, "a drawer listening for navigate stays open").not.toHaveBeenCalled();
  });

  it("keeps the badge text in the name and the reason in the description on the rail", () => {
    place(status("3 unread"), "collapsed");
    const inbox = screen.getByRole("button", { name: "Inbox, 3 unread" });
    expect(inbox.querySelector(".sidebar__badge")).toHaveTextContent("3");
    const reports = screen.getByRole("link", { name: "Reports" });
    expect(reports).toHaveAccessibleDescription("Ask an administrator for access");
    expect(reports.closest("ds-tooltip")).toHaveAttribute(
      "text",
      "Reports: Ask an administrator for access",
    );
  });

  it("announces nothing for the first sections", () => {
    place(status("3 unread"));
    expect(live()).toHaveAttribute("aria-live", "polite");
    expect(live().textContent?.trim()).toBe("");
  });

  it("announces a badge that appears or changes, once, and not with announce: false", () => {
    const sidebar = place(status());
    sidebar.sections = status("3 unread");
    expect(live().textContent?.trim()).toBe("Inbox: 3 unread");
    sidebar.sections = status("4 unread", false);
    expect(live().textContent?.trim()).toBe("Inbox: 3 unread");
  });

  it("holds the latest announcement while a modal dialog is open", async () => {
    const sidebar = place(status());
    const dialog = document.createElement("dialog");
    document.body.append(dialog);
    dialog.setAttribute("open", "");
    const release = trackModal(dialog);
    sidebar.sections = status("1 unread");
    sidebar.sections = status("2 unread");
    expect(live().textContent?.trim()).toBe("");
    dialog.removeAttribute("open");
    release();
    await vi.waitFor(() => expect(live().textContent?.trim()).toBe("Inbox: 2 unread"));
  });

  it("announces inside the modal that holds it, such as its drawer", () => {
    document.body.innerHTML = `<dialog open><ds-sidebar></ds-sidebar></dialog>`;
    const dialog = document.querySelector("dialog")!;
    const release = trackModal(dialog);
    const sidebar = document.querySelector("ds-sidebar") as DsSidebar;
    sidebar.sections = status();
    sidebar.sections = status("1 unread");
    expect(live().textContent?.trim()).toBe("Inbox: 1 unread");
    release();
  });

  it("has no accessibility violations with a badge and an unavailable destination", async () => {
    place(status("3 unread"), 'label="Primary"');
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("has no accessibility violations on the rail", async () => {
    place(status("3 unread"), 'label="Primary" collapsed');
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
