import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { h, markRaw, nextTick } from "vue";
import { trackModal } from "../internal/modal-stack";
import { NavigationBar, type NavigationDestination } from "./NavigationBar";

const Dot = markRaw({
  name: "Dot",
  render: () =>
    h("svg", { viewBox: "0 0 24 24", width: 16, height: 16, "aria-hidden": "true" }, [
      h("circle", { cx: 12, cy: 12, r: 8, fill: "currentColor" }),
    ]),
});

const sections: NavigationDestination[] = [
  { value: "home", label: "Home", href: "/home", icon: Dot },
  { value: "clients", label: "Clients", icon: Dot },
  {
    value: "projects",
    label: "Projects",
    icon: Dot,
    unavailable: { reason: "Available online only" },
  },
  { value: "hours", label: "Hours", icon: Dot },
  { value: "profile", label: "Profile", icon: Dot, badge: { label: "Needs attention" } },
];

const withBadge = (label?: string, announce?: boolean): NavigationDestination[] => [
  { value: "home", label: "Home", icon: Dot },
  {
    value: "profile",
    label: "Profile",
    icon: Dot,
    badge: label === undefined ? undefined : { label, announce },
  },
];

const mount = (props: Record<string, unknown> = {}) =>
  render(NavigationBar, { props: { destinations: sections, value: "hours", ...props } });

const live = () => document.querySelector(".navigation-bar__live")!.textContent?.trim();

afterEach(() => {
  document.body.replaceChildren();
});

describe("Vue NavigationBar", () => {
  it("is a labelled navigation landmark around a list of links and buttons", () => {
    mount();
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/home");
    expect(screen.getByRole("button", { name: "Clients" })).toHaveAttribute("type", "button");
    expect(document.querySelector("[role=tablist], [role=tab], [role=menu]")).toBeNull();
  });

  it("marks only the current destination with aria-current", () => {
    mount();
    expect(screen.getByRole("button", { name: "Hours" })).toHaveAttribute("aria-current", "page");
    expect(document.querySelectorAll("[aria-current]")).toHaveLength(1);
  });

  it("reads the badge text inside the destination's name", () => {
    mount();
    expect(screen.getByRole("button", { name: "Profile, Needs attention" })).toBeInTheDocument();
  });

  it("keeps an unavailable destination focusable with its reason as the description", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    mount({ onSelect });
    const projects = screen.getByRole("button", { name: "Projects" });
    expect(projects).toHaveAttribute("aria-disabled", "true");
    expect(projects).not.toBeDisabled();
    expect(projects).toHaveAccessibleDescription("Available online only");
    await user.click(projects);
    expect(onSelect).not.toHaveBeenCalled();
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

  it("reports a button once per press, again on the current one, read live", async () => {
    const user = userEvent.setup();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = mount({ onSelect: first });
    await user.click(screen.getByRole("button", { name: "Hours" }));
    expect(first).toHaveBeenCalledExactlyOnceWith("hours");
    await rerender({ onSelect: second });
    screen.getByRole("button", { name: "Clients" }).focus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(second).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledWith("clients");
    expect(first).toHaveBeenCalledTimes(1);
  });

  it("reports nothing for a link, and Space does not press it", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    mount({ onSelect });
    screen.getByRole("link", { name: "Home" }).focus();
    await user.keyboard(" ");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("has no accessibility violations with a badge and an unavailable destination", async () => {
    const { container } = mount();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Vue NavigationBar badge announcements", () => {
  it("announces nothing on mount", async () => {
    mount({ destinations: withBadge("Needs attention") });
    await nextTick();
    expect(live()).toBe("");
  });

  it("announces a badge that appears or changes, once and politely", async () => {
    const { rerender } = mount({ destinations: withBadge() });
    expect(document.querySelector(".navigation-bar__live")).toHaveAttribute("aria-live", "polite");
    await rerender({ destinations: withBadge("Needs attention") });
    expect(live()).toBe("Profile: Needs attention");
    await rerender({ destinations: withBadge("2 unread") });
    expect(live()).toBe("Profile: 2 unread");
  });

  it("stays silent with announce: false and when a badge goes away", async () => {
    const { rerender } = mount({ destinations: withBadge() });
    await rerender({ destinations: withBadge("3 unread", false) });
    expect(live()).toBe("");
    await rerender({ destinations: withBadge() });
    expect(live()).toBe("");
  });

  it("holds the latest announcement while a modal dialog is open", async () => {
    const { rerender } = mount({ destinations: withBadge() });
    const dialog = document.createElement("dialog");
    document.body.append(dialog);
    dialog.setAttribute("open", "");
    const release = trackModal(dialog);
    await rerender({ destinations: withBadge("1 unread") });
    await rerender({ destinations: withBadge("2 unread") });
    expect(live()).toBe("");
    dialog.removeAttribute("open");
    release();
    await vi.waitFor(() => expect(live()).toBe("Profile: 2 unread"));
  });
});
