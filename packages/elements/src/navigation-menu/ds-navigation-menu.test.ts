import { fireEvent, screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { onTestFinished, vi } from "vitest";
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

  it("closes a hover-opened panel when the pointer leaves", () => {
    vi.useFakeTimers();
    mount();
    const products = screen.getByRole("button", { name: "Products" });
    fireEvent.pointerEnter(products, { pointerType: "mouse" });
    vi.advanceTimersByTime(150);
    expect(products).toHaveAttribute("aria-expanded", "true");

    // Moving onto the panel keeps it open; leaving it closes after the delay.
    fireEvent.pointerLeave(products, { pointerType: "mouse" });
    const panel = document.querySelector<HTMLElement>(".navmenu__content")!;
    fireEvent.pointerEnter(panel, { pointerType: "mouse" });
    vi.advanceTimersByTime(300);
    expect(products).toHaveAttribute("aria-expanded", "true");
    fireEvent.pointerLeave(panel, { pointerType: "mouse" });
    vi.advanceTimersByTime(149);
    expect(products).toHaveAttribute("aria-expanded", "true");
    vi.advanceTimersByTime(1);
    expect(products).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps a hover-opened panel open after a click, until a second click", () => {
    vi.useFakeTimers();
    const menu = mount();
    const seen: Array<string | null> = [];
    menu.addEventListener("value-change", (e) => seen.push((e as CustomEvent).detail.value));
    const products = screen.getByRole("button", { name: "Products" });
    fireEvent.pointerEnter(products, { pointerType: "mouse" });
    vi.advanceTimersByTime(150);
    fireEvent.click(products);
    expect(products).toHaveAttribute("aria-expanded", "true");

    fireEvent.pointerLeave(products, { pointerType: "mouse" });
    vi.advanceTimersByTime(500);
    expect(products).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(products);
    expect(products).toHaveAttribute("aria-expanded", "false");
    expect(seen).toEqual(["products", null]);
  });

  it("does not undo a click made within the hover delay", () => {
    vi.useFakeTimers();
    mount();
    const products = screen.getByRole("button", { name: "Products" });
    fireEvent.pointerEnter(products, { pointerType: "mouse" });
    vi.advanceTimersByTime(50);
    fireEvent.click(products);
    expect(products).toHaveAttribute("aria-expanded", "true");
    vi.advanceTimersByTime(500);
    expect(products).toHaveAttribute("aria-expanded", "true");
    // The click kept it: the pointer leaving does not close it.
    fireEvent.pointerLeave(products, { pointerType: "mouse" });
    vi.advanceTimersByTime(500);
    expect(products).toHaveAttribute("aria-expanded", "true");
  });

  it("does not reopen on hover after a click closed it while the pointer stays", () => {
    vi.useFakeTimers();
    mount();
    const products = screen.getByRole("button", { name: "Products" });
    fireEvent.pointerEnter(products, { pointerType: "mouse" });
    vi.advanceTimersByTime(150);
    fireEvent.click(products);
    fireEvent.click(products);
    expect(products).toHaveAttribute("aria-expanded", "false");
    fireEvent.pointerMove(products, { pointerType: "mouse" });
    vi.advanceTimersByTime(1000);
    expect(products).toHaveAttribute("aria-expanded", "false");

    // Entering the trigger again opens on hover as usual.
    fireEvent.pointerLeave(products, { pointerType: "mouse" });
    fireEvent.pointerEnter(products, { pointerType: "mouse" });
    vi.advanceTimersByTime(150);
    expect(products).toHaveAttribute("aria-expanded", "true");
  });

  it("closes on Escape and on a press outside, with no pending hover reopening it", () => {
    vi.useFakeTimers();
    mount();
    const products = screen.getByRole("button", { name: "Products" });
    fireEvent.pointerEnter(products, { pointerType: "mouse" });
    vi.advanceTimersByTime(150);
    fireEvent.click(products);
    products.focus();
    fireEvent.keyDown(products, { key: "Escape" });
    expect(products).toHaveAttribute("aria-expanded", "false");
    expect(products).toHaveFocus();
    vi.advanceTimersByTime(1000);
    expect(products).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(products);
    const outside = screen.getByRole("button", { name: "Outside" });
    fireEvent.pointerDown(outside);
    expect(products).toHaveAttribute("aria-expanded", "false");
    expect(products).toHaveFocus();
    vi.advanceTimersByTime(1000);
    expect(products).toHaveAttribute("aria-expanded", "false");
  });

  it("opens and keeps an item set by the page", () => {
    vi.useFakeTimers();
    const menu = mount();
    menu.value = "products";
    const products = screen.getByRole("button", { name: "Products" });
    expect(products).toHaveAttribute("aria-expanded", "true");
    fireEvent.pointerLeave(products, { pointerType: "mouse" });
    vi.advanceTimersByTime(500);
    expect(products).toHaveAttribute("aria-expanded", "true");
    menu.value = null;
    expect(products).toHaveAttribute("aria-expanded", "false");
  });
});

describe("<ds-navigation-menu> links", () => {
  const withCurrent: NavigationMenuItem[] = [
    { value: "home", label: "Home", href: "#home" },
    {
      value: "products",
      label: "Products",
      links: [
        { label: "Catalog", href: "#catalog", current: true },
        { label: "Lineage", href: "#lineage" },
      ],
    },
    { value: "about", label: "About", href: "#about", current: false },
  ];

  const mountCurrent = (list = withCurrent) => {
    document.body.innerHTML = `<ds-navigation-menu label="Site"></ds-navigation-menu><h1 tabindex="-1">Page</h1>`;
    const menu = document.querySelector("ds-navigation-menu") as DsNavigationMenu;
    menu.items = list;
    return menu;
  };
  const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

  it("marks only the current link as the page, and its trigger for styling only", async () => {
    const user = userEvent.setup();
    mountCurrent();
    const products = screen.getByRole("button", { name: "Products" });
    expect(products).toHaveAttribute("data-current", "");
    expect(products).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");

    await user.click(products);
    expect(screen.getByRole("link", { name: "Catalog" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Catalog" })).toHaveAttribute("data-current", "");
    expect(screen.getByRole("link", { name: "Lineage" })).not.toHaveAttribute("aria-current");
    expect(document.querySelectorAll("[aria-current]")).toHaveLength(1);
  });

  it("marks a current top-level link", () => {
    mountCurrent([{ value: "home", label: "Home", href: "#home", current: true }]);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
  });

  it("closes the panel on a link click and leaves focus where the page puts it", async () => {
    const user = userEvent.setup();
    const menu = mountCurrent();
    const seen: Array<string | null> = [];
    menu.addEventListener("value-change", (e) => seen.push((e as CustomEvent).detail.value));
    const heading = screen.getByRole("heading", { name: "Page" });
    // The page moves focus to its new content when a link is followed.
    const moveFocus = (event: Event) => {
      if ((event.target as Element).closest("a")) heading.focus();
    };
    document.addEventListener("click", moveFocus);
    onTestFinished(() => document.removeEventListener("click", moveFocus));

    await user.click(screen.getByRole("button", { name: "Products" }));
    await user.click(screen.getByRole("link", { name: "Lineage" }));
    expect(screen.queryByRole("link", { name: "Lineage" })).toBeNull();
    expect(seen).toEqual(["products", null]);
    await settled();
    expect(heading).toHaveFocus();
  });

  it("puts focus back on the trigger when the link click left it on the body", async () => {
    const user = userEvent.setup();
    mountCurrent();
    const products = screen.getByRole("button", { name: "Products" });
    await user.click(products);
    await user.click(screen.getByRole("link", { name: "Lineage" }));
    expect(screen.queryByRole("link", { name: "Lineage" })).toBeNull();
    await settled();
    expect(products).toHaveFocus();
  });

  it("closes an open panel when a top-level link is followed", async () => {
    const user = userEvent.setup();
    mountCurrent();
    const products = screen.getByRole("button", { name: "Products" });
    await user.click(products);
    await user.click(screen.getByRole("link", { name: "About" }));
    expect(products).toHaveAttribute("aria-expanded", "false");
  });
});

describe("<ds-navigation-menu> accessibility", () => {
  it("has no accessibility violations while open", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole("button", { name: "Products" }));
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
