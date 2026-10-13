import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { trackModal } from "../internal/modal-stack";
import {
  NavigationBar,
  type NavigationBarProps,
  type NavigationDestination,
} from "./NavigationBar";

const dot = (
  <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden="true">
    <circle cx={12} cy={12} r={8} fill="currentColor" />
  </svg>
);

const sections: NavigationDestination[] = [
  { value: "home", label: "Home", href: "/home", icon: dot },
  { value: "clients", label: "Clients", icon: dot },
  {
    value: "projects",
    label: "Projects",
    icon: dot,
    unavailable: { reason: "Available online only" },
  },
  { value: "hours", label: "Hours", icon: dot },
  { value: "profile", label: "Profile", icon: dot, badge: { label: "Needs attention" } },
];

const withBadge = (label?: string, announce?: boolean): NavigationDestination[] => [
  { value: "home", label: "Home", icon: dot },
  {
    value: "profile",
    label: "Profile",
    icon: dot,
    badge: label === undefined ? undefined : { label, announce },
  },
];

const bar = (props: Partial<NavigationBarProps> = {}) => (
  <StrictMode>
    <NavigationBar destinations={sections} value="hours" {...props} />
  </StrictMode>
);

const live = () => document.querySelector(".navigation-bar__live")!.textContent;

afterEach(() => {
  document.body.replaceChildren();
});

describe("React NavigationBar", () => {
  it("is a labelled navigation landmark around a list of links and buttons", () => {
    render(bar());
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/home");
    expect(screen.getByRole("button", { name: "Clients" })).toHaveAttribute("type", "button");
    expect(document.querySelector("[role=tablist], [role=tab], [role=menu]")).toBeNull();
  });

  it("marks only the current destination with aria-current", () => {
    render(bar());
    expect(screen.getByRole("button", { name: "Hours" })).toHaveAttribute("aria-current", "page");
    expect(document.querySelectorAll("[aria-current]")).toHaveLength(1);
  });

  it("reads the badge text inside the destination's name", () => {
    render(bar());
    expect(screen.getByRole("button", { name: "Profile, Needs attention" })).toBeInTheDocument();
  });

  it("keeps an unavailable destination focusable with its reason as the description", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(bar({ onSelect }));
    const projects = screen.getByRole("button", { name: "Projects" });
    expect(projects).toHaveAttribute("aria-disabled", "true");
    expect(projects).not.toBeDisabled();
    expect(projects).toHaveAccessibleDescription("Available online only");
    await user.click(projects);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("moves with the arrows without wrapping", async () => {
    const user = userEvent.setup();
    render(bar());
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
    const { rerender } = render(bar({ onSelect: first }));
    await user.click(screen.getByRole("button", { name: "Hours" }));
    expect(first).toHaveBeenCalledExactlyOnceWith("hours");
    rerender(bar({ onSelect: second }));
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
    render(bar({ onSelect }));
    screen.getByRole("link", { name: "Home" }).focus();
    await user.keyboard(" ");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("has no accessibility violations with a badge and an unavailable destination", async () => {
    const { container } = render(bar());
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("React NavigationBar badge announcements", () => {
  it("announces nothing on mount, under strict mode", () => {
    render(bar({ destinations: withBadge("Needs attention") }));
    expect(live()).toBe("");
  });

  it("announces a badge that appears or changes, once and politely", () => {
    const { rerender } = render(bar({ destinations: withBadge() }));
    expect(document.querySelector(".navigation-bar__live")).toHaveAttribute("aria-live", "polite");
    rerender(bar({ destinations: withBadge("Needs attention") }));
    expect(live()).toBe("Profile: Needs attention");
    rerender(bar({ destinations: withBadge("2 unread") }));
    expect(live()).toBe("Profile: 2 unread");
  });

  it("stays silent with announce: false and when a badge goes away", () => {
    const { rerender } = render(bar({ destinations: withBadge() }));
    rerender(bar({ destinations: withBadge("3 unread", false) }));
    expect(live()).toBe("");
    rerender(bar({ destinations: withBadge() }));
    expect(live()).toBe("");
  });

  it("holds the latest announcement while a modal dialog is open", async () => {
    const { rerender } = render(bar({ destinations: withBadge() }));
    const dialog = document.createElement("dialog");
    document.body.append(dialog);
    dialog.setAttribute("open", "");
    const release = trackModal(dialog);
    rerender(bar({ destinations: withBadge("1 unread") }));
    rerender(bar({ destinations: withBadge("2 unread") }));
    expect(live()).toBe("");
    await act(async () => {
      dialog.removeAttribute("open");
      release();
    });
    await vi.waitFor(() => expect(live()).toBe("Profile: 2 unread"));
  });
});
