import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Menu, type MenuSection } from "./Menu";

const sections: MenuSection[] = [
  {
    label: "Main",
    items: [
      { value: "home", label: "Home" },
      { value: "search", label: "Search" },
      { value: "alerts", label: "Alerts" },
    ],
  },
  { label: "More", items: [{ value: "settings", label: "Settings", href: "#settings" }] },
];

const renderMenu = (props: Record<string, unknown> = {}) =>
  render(Menu, { props: { sections, value: "home", ...props } });

// Menu is the former name of Sidebar (ADR 0013). What it promised keeps
// working until the removal: the same props, the same slots, the landmark and
// its name, the current entry, and the callback. Class names were never public
// surface, so they are not held here.
describe("Menu, the deprecated name of Sidebar", () => {
  it("renders the same labelled navigation landmark", () => {
    renderMenu();
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getAllByRole("list")).toHaveLength(2);
  });

  it("takes an explicit label over the catalog default", () => {
    renderMenu({ label: "Sidebar" });
    expect(screen.getByRole("navigation", { name: "Sidebar" })).toBeInTheDocument();
  });

  it("marks the current destination with aria-current", () => {
    renderMenu();
    expect(screen.getByRole("button", { name: "Home" })).toHaveAttribute("aria-current", "page");
  });

  it("renders entries with an href as links", () => {
    renderMenu();
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("href", "#settings");
  });

  it("reports onSelect when a button entry is activated", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderMenu({ onSelect });
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(onSelect).toHaveBeenCalledWith("search");
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("keeps rendering the logo and footer slots", () => {
    render(Menu, {
      props: { sections },
      slots: { logo: () => "Acme", footer: () => "v1.0" },
    });
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("v1.0")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = renderMenu();
    expect(await axe(container)).toHaveNoViolations();
  });
});
