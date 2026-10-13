import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { tick } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { trackModal } from "../internal/modal-stack";
import Dot from "../sidebar/sidebar-icon.fixture.svelte";
import Fixture from "./navigation-bar.fixture.svelte";
import type { NavigationDestination } from "./types";

const live = () => document.querySelector(".navigation-bar__live")!;

const withBadge = (label?: string, announce?: boolean): NavigationDestination[] => [
  { value: "home", label: "Home", icon: Dot },
  {
    value: "profile",
    label: "Profile",
    icon: Dot,
    badge: label === undefined ? undefined : { label, announce },
  },
];

afterEach(() => {
  document.body.replaceChildren();
});

describe("NavigationBar", () => {
  it("is a labelled navigation landmark around a list of links and buttons", () => {
    render(Fixture);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/home");
    expect(screen.getByRole("button", { name: "Clients" })).toHaveAttribute("type", "button");
    expect(document.querySelector("[role=tablist], [role=tab], [role=menu]")).toBeNull();
  });

  it("marks only the current destination with aria-current", () => {
    render(Fixture);
    expect(screen.getByRole("button", { name: "Hours" })).toHaveAttribute("aria-current", "page");
    expect(document.querySelectorAll("[aria-current]")).toHaveLength(1);
  });

  it("reads the badge text inside the destination's name", () => {
    render(Fixture);
    expect(screen.getByRole("button", { name: "Profile, Needs attention" })).toBeInTheDocument();
  });

  it("keeps an unavailable destination focusable with its reason as the description", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(Fixture, { props: { onSelect } });
    const projects = screen.getByRole("button", { name: "Projects" });
    expect(projects).toHaveAttribute("aria-disabled", "true");
    expect(projects).not.toBeDisabled();
    expect(projects).toHaveAccessibleDescription("Available online only");
    await user.click(projects);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("visits every destination with Tab, then leaves the bar", async () => {
    const user = userEvent.setup();
    render(Fixture);
    screen.getByRole("link", { name: "Before" }).focus();
    for (const name of ["Home", "Clients", "Projects", "Hours", "Profile, Needs attention"]) {
      await user.tab();
      expect(document.activeElement).toHaveAccessibleName(name);
    }
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("link", { name: "After" }));
  });

  it("moves with the arrows without wrapping", async () => {
    const user = userEvent.setup();
    render(Fixture);
    screen.getByRole("link", { name: "Home" }).focus();
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toHaveAccessibleName("Home");
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(document.activeElement).toHaveAccessibleName("Projects");
  });

  it("reports a button once per press, again on the current one, read live", async () => {
    const user = userEvent.setup();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(Fixture, { props: { onSelect: first } });
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
    render(Fixture, { props: { onSelect } });
    screen.getByRole("link", { name: "Home" }).focus();
    await user.keyboard(" ");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("has no accessibility violations with a badge and an unavailable destination", async () => {
    const { container } = render(Fixture);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("NavigationBar badge announcements", () => {
  it("announces nothing on mount", async () => {
    render(Fixture, { props: { destinations: withBadge("Needs attention") } });
    await tick();
    expect(live().textContent?.trim()).toBe("");
  });

  it("announces a badge that appears or changes, once and politely", async () => {
    const { rerender } = render(Fixture, { props: { destinations: withBadge() } });
    expect(live()).toHaveAttribute("aria-live", "polite");
    await rerender({ destinations: withBadge("Needs attention") });
    expect(live().textContent?.trim()).toBe("Profile: Needs attention");
    await rerender({ destinations: withBadge("2 unread") });
    expect(live().textContent?.trim()).toBe("Profile: 2 unread");
  });

  it("stays silent with announce: false and when a badge goes away", async () => {
    const { rerender } = render(Fixture, { props: { destinations: withBadge() } });
    await rerender({ destinations: withBadge("3 unread", false) });
    expect(live().textContent?.trim()).toBe("");
    await rerender({ destinations: withBadge() });
    expect(live().textContent?.trim()).toBe("");
  });

  it("holds the latest announcement while a modal dialog is open", async () => {
    const { rerender } = render(Fixture, { props: { destinations: withBadge() } });
    const dialog = document.createElement("dialog");
    document.body.append(dialog);
    dialog.setAttribute("open", "");
    const release = trackModal(dialog);
    await rerender({ destinations: withBadge("1 unread") });
    await rerender({ destinations: withBadge("2 unread") });
    expect(live().textContent?.trim()).toBe("");
    dialog.removeAttribute("open");
    release();
    await vi.waitFor(() => expect(live().textContent?.trim()).toBe("Profile: 2 unread"));
  });
});
