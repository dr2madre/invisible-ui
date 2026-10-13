import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import { trackModal } from "../internal/modal-stack";
import type { DsNavigationBar, NavigationDestination } from "./ds-navigation-bar";

const DOT = "M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16";

const sections: NavigationDestination[] = [
  { value: "home", label: "Home", href: "/home", icon: DOT },
  { value: "clients", label: "Clients", icon: DOT },
  {
    value: "projects",
    label: "Projects",
    icon: DOT,
    unavailable: { reason: "Available online only" },
  },
  { value: "hours", label: "Hours", icon: DOT },
  { value: "profile", label: "Profile", icon: DOT, badge: { label: "Needs attention" } },
];

const withBadge = (label?: string, announce?: boolean): NavigationDestination[] => [
  { value: "home", label: "Home", icon: DOT },
  {
    value: "profile",
    label: "Profile",
    icon: DOT,
    badge: label === undefined ? undefined : { label, announce },
  },
];

const mount = (destinations = sections) => {
  document.body.innerHTML = `<ds-navigation-bar value="hours"></ds-navigation-bar>`;
  const bar = document.querySelector("ds-navigation-bar") as DsNavigationBar;
  bar.destinations = destinations;
  return bar;
};

const live = () => document.querySelector(".navigation-bar__live")!.textContent;

afterEach(() => {
  document.body.replaceChildren();
});

describe("<ds-navigation-bar>", () => {
  it("is a labelled navigation landmark around a list of links and buttons", () => {
    mount();
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/home");
    expect(screen.getByRole("button", { name: "Clients" })).toHaveAttribute("type", "button");
    expect(document.querySelector("[role=tablist], [role=tab], [role=menu]")).toBeNull();
  });

  it("marks only the current destination with aria-current, and follows value", () => {
    const bar = mount();
    expect(screen.getByRole("button", { name: "Hours" })).toHaveAttribute("aria-current", "page");
    bar.value = "clients";
    expect(screen.getByRole("button", { name: "Clients" })).toHaveAttribute("aria-current", "page");
    expect(document.querySelectorAll("[aria-current]")).toHaveLength(1);
  });

  it("reads the badge text inside the destination's name", () => {
    mount();
    expect(screen.getByRole("button", { name: "Profile, Needs attention" })).toBeInTheDocument();
  });

  it("keeps an unavailable destination focusable with its reason as the description", async () => {
    const user = userEvent.setup();
    const bar = mount();
    const select = vi.fn();
    bar.addEventListener("select", select);
    const projects = screen.getByRole("button", { name: "Projects" });
    expect(projects).toHaveAttribute("aria-disabled", "true");
    expect(projects).not.toBeDisabled();
    expect(projects).toHaveAccessibleDescription("Available online only");
    await user.click(projects);
    expect(select).not.toHaveBeenCalled();
  });

  it("moves with the arrows without wrapping", async () => {
    const user = userEvent.setup();
    mount();
    screen.getByRole("link", { name: "Home" }).focus();
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toHaveAccessibleName("Home");
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(document.activeElement).toHaveAccessibleName("Projects");
    await user.tab();
    expect(document.activeElement).toHaveAccessibleName("Hours");
  });

  it("emits select once per press, again on the current one, and keeps focus", async () => {
    const user = userEvent.setup();
    const bar = mount();
    const select = vi.fn();
    bar.addEventListener("select", (event) => {
      select((event as CustomEvent<{ value: string }>).detail.value);
      bar.value = (event as CustomEvent<{ value: string }>).detail.value;
    });
    await user.click(screen.getByRole("button", { name: "Hours" }));
    screen.getByRole("button", { name: "Clients" }).focus();
    await user.keyboard("{Enter}");
    expect(select.mock.calls).toEqual([["hours"], ["clients"]]);
    expect(document.activeElement).toHaveAccessibleName("Clients");
  });

  it("emits nothing for a link, and Space does not press it", async () => {
    const user = userEvent.setup();
    const bar = mount();
    const select = vi.fn();
    bar.addEventListener("select", select);
    screen.getByRole("link", { name: "Home" }).focus();
    await user.keyboard(" ");
    expect(select).not.toHaveBeenCalled();
  });

  it("has no accessibility violations with a badge and an unavailable destination", async () => {
    mount();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe("<ds-navigation-bar> badge announcements", () => {
  it("announces nothing on first render", () => {
    mount(withBadge("Needs attention"));
    expect(live()).toBe("");
  });

  it("announces a badge that appears or changes, once and politely", () => {
    const bar = mount(withBadge());
    expect(document.querySelector(".navigation-bar__live")).toHaveAttribute("aria-live", "polite");
    bar.destinations = withBadge("Needs attention");
    expect(live()).toBe("Profile: Needs attention");
    bar.destinations = withBadge("2 unread");
    expect(live()).toBe("Profile: 2 unread");
  });

  it("stays silent with announce: false and when a badge goes away", () => {
    const bar = mount(withBadge());
    bar.destinations = withBadge("3 unread", false);
    expect(live()).toBe("");
    bar.destinations = withBadge();
    expect(live()).toBe("");
  });

  it("holds the latest announcement while a modal dialog is open", async () => {
    const bar = mount(withBadge());
    const dialog = document.createElement("dialog");
    document.body.append(dialog);
    dialog.setAttribute("open", "");
    const release = trackModal(dialog);
    bar.destinations = withBadge("1 unread");
    bar.destinations = withBadge("2 unread");
    expect(live()).toBe("");
    dialog.removeAttribute("open");
    release();
    await vi.waitFor(() => expect(live()).toBe("Profile: 2 unread"));
  });
});
