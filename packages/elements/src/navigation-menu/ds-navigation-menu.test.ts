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

  it("closes when Tab moves focus out of the trigger and the panel", async () => {
    const user = userEvent.setup();
    mount();
    const trigger = screen.getByRole("button", { name: "Products" });
    await user.click(trigger);
    await user.tab();
    expect(screen.getByRole("link", { name: /Catalog/ })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: /Lineage/ })).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    await user.tab();
    const docs = screen.getByRole("button", { name: "Docs" });
    expect(docs).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: /Catalog/ })).toBeNull();
  });

  it("writes no empty landmark name and warns once without a label", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    document.body.innerHTML = `<ds-navigation-menu></ds-navigation-menu>`;
    const menu = document.querySelector("ds-navigation-menu") as DsNavigationMenu;
    menu.items = items;
    const nav = menu.querySelector("nav")!;
    expect(nav).not.toHaveAttribute("aria-label");
    expect(warn).toHaveBeenCalledTimes(1);
    menu.setAttribute("label", "Site");
    expect(nav).toHaveAttribute("aria-label", "Site");
    menu.removeAttribute("label");
    expect(nav).not.toHaveAttribute("aria-label");
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
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

  it("reads an empty open-delay as the default delay, not as zero", () => {
    vi.useFakeTimers();
    const menu = mount();
    menu.setAttribute("open-delay", "");
    const products = screen.getByRole("button", { name: "Products" });
    fireEvent.pointerEnter(products, { pointerType: "mouse" });
    vi.advanceTimersByTime(0);
    expect(products).toHaveAttribute("aria-expanded", "false");
    vi.advanceTimersByTime(150);
    expect(products).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps a panel closed by click closed when the hover delay runs out", () => {
    vi.useFakeTimers();
    mount();
    const products = screen.getByRole("button", { name: "Products" });
    // A pointer click hovers the trigger first, which starts the open delay.
    fireEvent.pointerEnter(products, { pointerType: "mouse" });
    fireEvent.click(products);
    expect(products).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(products);
    expect(products).toHaveAttribute("aria-expanded", "false");
    vi.advanceTimersByTime(150);
    expect(products).toHaveAttribute("aria-expanded", "false");
  });

  it("has no accessibility violations while open", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", { name: "Products" }));
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
