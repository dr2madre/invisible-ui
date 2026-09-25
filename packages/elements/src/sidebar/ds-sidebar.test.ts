import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
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
    await user.click(screen.getByRole("button", { name: "Collapse the navigation" }));
    expect(seen).toEqual([true]);
    expect(screen.getByRole("navigation")).toHaveAttribute("data-collapsed");
    expect(screen.getByRole("button", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Expand the navigation" })).toHaveFocus();
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
