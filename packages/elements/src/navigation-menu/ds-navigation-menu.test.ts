import { fireEvent, screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { axe } from "vitest-axe";
import "../define";
import type { DsNavigationMenu, NavigationMenuItem } from "./ds-navigation-menu";

const items: NavigationMenuItem[] = [
  { value: "home", label: "Home", href: "/" },
  {
    value: "products",
    label: "Products",
    links: [
      { label: "Catalog", href: "/catalog", description: "Every table in one place" },
      { label: "Lineage", href: "/lineage" },
    ],
  },
  { value: "docs", label: "Docs", links: [{ label: "Guides", href: "/guides" }] },
];

const mount = () => {
  document.body.innerHTML = `<ds-navigation-menu label="Site"></ds-navigation-menu><button type="button">Outside</button>`;
  const menu = document.querySelector("ds-navigation-menu") as DsNavigationMenu;
  menu.items = items;
  return menu;
};

describe("<ds-navigation-menu>", () => {
  afterEach(() => vi.useRealTimers());

  it("renders a named landmark with links and disclosure triggers", () => {
    mount();
    expect(screen.getByRole("navigation", { name: "Site" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("button", { name: "Products" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("toggles a panel on click and reports the open item", async () => {
    const user = userEvent.setup();
    const menu = mount();
    const seen: Array<string | null> = [];
    menu.addEventListener("value-change", (e) => seen.push((e as CustomEvent).detail.value));
    const trigger = screen.getByRole("button", { name: "Products" });

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const catalog = screen.getByRole("link", { name: /Catalog/ });
    expect(catalog).toHaveTextContent("Every table in one place");
    expect(trigger).toHaveAttribute("aria-controls", catalog.closest(".navmenu__content")!.id);
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    expect(screen.queryByRole("link", { name: /Catalog/ })).toBeNull();
    expect(seen).toEqual(["products", null]);
  });

  it("moves into the panel with ArrowDown and back with Escape", async () => {
    const user = userEvent.setup();
    mount();
    const trigger = screen.getByRole("button", { name: "Products" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("link", { name: /Catalog/ })).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("moves focus into the panel during the ArrowDown dispatch and reports it once", () => {
    const menu = mount();
    const seen: Array<string | null> = [];
    menu.addEventListener("value-change", (e) => seen.push((e as CustomEvent).detail.value));
    const trigger = screen.getByRole("button", { name: "Products" });
    trigger.focus();
    // A browser runs microtasks between listeners, before the core's opens
    // the panel: focus must move within the dispatch, not in a later task.
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(screen.getByRole("link", { name: /Catalog/ })).toHaveFocus();
    expect(seen).toEqual(["products"]);
  });

  it("closes on a press outside", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", { name: "Products" }));
    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("link", { name: /Catalog/ })).toBeNull();
  });

  it("opens on hover after the delay and switches at once while open", () => {
    vi.useFakeTimers();
    mount();
    const products = screen.getByRole("button", { name: "Products" });
    fireEvent.pointerEnter(products, { pointerType: "mouse" });
    expect(products).toHaveAttribute("aria-expanded", "false");
    vi.advanceTimersByTime(150);
    expect(products).toHaveAttribute("aria-expanded", "true");
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Docs" }), { pointerType: "mouse" });
    expect(screen.getByRole("link", { name: "Guides" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Catalog/ })).toBeNull();
  });

  it("has no accessibility violations while open", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", { name: "Products" }));
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
