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

describe("Vue Menu (sidebar navigation)", () => {
  it("renders a labelled navigation landmark with its sections", () => {
    renderMenu();
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(document.querySelectorAll(".menu__section")).toHaveLength(2);
  });

  it("takes an explicit label over the catalog default", () => {
    renderMenu({ label: "Sidebar" });
    expect(screen.getByRole("navigation", { name: "Sidebar" })).toBeInTheDocument();
  });

  it("marks the active entry with aria-current", () => {
    renderMenu();
    const active = document.querySelector(".menu__item--active")!;
    expect(active).toHaveAttribute("aria-current", "page");
    expect(active).toHaveTextContent("Home");
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
  });

  it("renders the logo and footer slots", () => {
    render(Menu, {
      props: { sections },
      slots: { logo: () => "Acme", footer: () => "v1.0" },
    });
    expect(document.querySelector(".menu__logo")).toHaveTextContent("Acme");
    expect(document.querySelector(".menu__footer")).toHaveTextContent("v1.0");
  });

  it("has no accessibility violations", async () => {
    const { container } = renderMenu();
    expect(await axe(container)).toHaveNoViolations();
  });
});
