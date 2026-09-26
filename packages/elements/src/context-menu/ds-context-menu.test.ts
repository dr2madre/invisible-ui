import { fireEvent, screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsLocaleProvider } from "../locale-provider/ds-locale-provider";
import type { ContextMenuItem, DsContextMenu } from "./ds-context-menu";

const ITEMS: ContextMenuItem[] = [
  { value: "back", label: "Back" },
  { value: "reload", label: "Reload" },
  { value: "save", label: "Save as…", disabled: true },
  { value: "inspect", label: "Inspect" },
];

const mount = (attributes = 'label="Page actions"') => {
  document.body.innerHTML = `
    <button type="button">before</button>
    <ds-context-menu ${attributes}><div>Right-click here</div></ds-context-menu>
    <button type="button">after</button>`;
  const host = document.querySelector("ds-context-menu") as DsContextMenu;
  host.items = ITEMS;
  const onSelect = vi.fn();
  host.addEventListener("select", (event) => onSelect((event as CustomEvent).detail.value));
  return { host, onSelect };
};
const openAt = (x = 40, y = 40) =>
  fireEvent.contextMenu(screen.getByText("Right-click here"), { clientX: x, clientY: y });

describe("<ds-context-menu>", () => {
  it("is closed until the region is right-clicked", () => {
    mount();
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.querySelector(".context-menu__trigger")).toHaveAttribute("tabindex", "0");
  });

  it("opens at the pointer on contextmenu and exposes the items", () => {
    mount();
    expect(openAt()).toBe(false);
    const menu = screen.getByRole("menu");
    expect(menu).toBeVisible();
    expect(menu).toHaveAttribute("aria-label", "Page actions");
    expect(menu).not.toHaveAttribute("aria-labelledby");
    expect(screen.getAllByRole("menuitem")).toHaveLength(4);
    expect(screen.getByRole("menuitem", { name: "Back" })).toHaveFocus();
  });

  it("selects an item on click and closes", async () => {
    const user = userEvent.setup();
    const { onSelect } = mount();
    openAt();
    await user.click(screen.getByRole("menuitem", { name: "Reload" }));
    expect(onSelect).toHaveBeenCalledWith("reload");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("navigates with the keyboard and activates via Enter, skipping disabled", async () => {
    const user = userEvent.setup();
    const { onSelect } = mount();
    openAt();
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: "Inspect" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenCalledWith("inspect");
  });

  it("moves the highlight by typeahead", async () => {
    const user = userEvent.setup();
    mount();
    openAt();
    await user.keyboard("i");
    expect(screen.getByRole("menuitem", { name: "Inspect" })).toHaveFocus();
  });

  it("closes on Escape and restores focus to where it was", async () => {
    const user = userEvent.setup();
    mount();
    const before = screen.getByRole("button", { name: "before" });
    before.focus();
    openAt();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(before).toHaveFocus();
  });

  it("opens from the keyboard menu key at the region", () => {
    mount();
    const region = document.querySelector<HTMLElement>(".context-menu__trigger")!;
    region.focus();
    fireEvent.contextMenu(region, { clientX: 0, clientY: 0 });
    expect(screen.getByRole("menu")).toBeVisible();
  });

  it("opens on a long press on touch", () => {
    vi.useFakeTimers();
    try {
      mount();
      const region = document.querySelector<HTMLElement>(".context-menu__trigger")!;
      fireEvent.pointerDown(region, { pointerType: "touch", clientX: 20, clientY: 20 });
      vi.advanceTimersByTime(500);
      expect(screen.getByRole("menu")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("closes on an outside pointer press", async () => {
    const user = userEvent.setup();
    mount();
    openAt();
    await user.click(screen.getByRole("button", { name: "after" }));
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("closes when the page scrolls under it", () => {
    mount();
    openAt();
    window.dispatchEvent(new Event("scroll"));
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("stays closed while disabled", () => {
    mount('label="Page actions" disabled');
    openAt();
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("marks disabled items", () => {
    mount();
    openAt();
    expect(screen.getByRole("menuitem", { name: "Save as…" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("names the popup from the catalog without a label", () => {
    mount("");
    openAt();
    expect(screen.getByRole("menu", { name: "Context menu" })).toBeInTheDocument();
  });

  it("takes the default name from the locale provider", () => {
    document.body.innerHTML = `<ds-locale-provider locale="it"><ds-context-menu><div>Qui</div></ds-context-menu></ds-locale-provider>`;
    const provider = document.querySelector("ds-locale-provider") as DsLocaleProvider;
    provider.messages = { "contextMenu.label": "Menu contestuale" };
    (document.querySelector("ds-context-menu") as DsContextMenu).items = ITEMS;
    fireEvent.contextMenu(screen.getByText("Qui"), { clientX: 10, clientY: 10 });
    expect(screen.getByRole("menu", { name: "Menu contestuale" })).toBeInTheDocument();
  });

  it("renders labels as text", () => {
    const { host } = mount();
    host.items = [{ value: "x", label: "<img src=x onerror=alert(1)>" }];
    openAt();
    expect(screen.getByRole("menuitem")).toHaveTextContent("<img src=x onerror=alert(1)>");
    expect(document.querySelector("img")).toBeNull();
  });

  it("has no accessibility violations when open", async () => {
    mount();
    openAt();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
