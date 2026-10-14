import { fireEvent, render, screen, waitFor } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Calendar } from "./calendar/Calendar";
import { Carousel, type CarouselSlide } from "./carousel/Carousel";
import { Menubar } from "./menubar/Menubar";
import type { MenubarMenu } from "./menubar/use-menubar";
import { Pagination } from "./pagination/Pagination";
import { Tabs } from "./tabs/Tabs";

const tabItems = [
  { value: "account", label: "Account", content: "Account settings." },
  { value: "password", label: "Password", content: "Password settings." },
  { value: "team", label: "Team", content: "Team settings." },
];
const slides: CarouselSlide[] = [
  { image: "https://example.com/1.jpg", title: "Peaks", description: "Above the clouds." },
  { image: "https://example.com/2.jpg", title: "Valley", description: "Down by the river." },
  { image: "https://example.com/3.jpg", title: "Forest", description: "Among the pines." },
];
const menus: MenubarMenu[] = [
  { value: "file", label: "File", items: [{ value: "new", label: "New" }] },
  { value: "edit", label: "Edit", items: [{ value: "undo", label: "Undo" }], disabled: true },
  { value: "view", label: "View", items: [{ value: "zoom", label: "Zoom" }] },
];
const trigger = (name: string) => screen.getByRole("menuitem", { name });

describe("Vue arrows follow the reading direction", () => {
  // The page is right to left, with no locale provider anywhere.
  beforeEach(() => {
    document.documentElement.setAttribute("dir", "rtl");
  });
  afterEach(() => {
    document.documentElement.removeAttribute("dir");
  });

  it("Tabs: ArrowLeft goes to the next tab", async () => {
    const user = userEvent.setup();
    render(Tabs, { props: { items: tabItems, label: "Settings", value: "account" } });
    screen.getByRole("tab", { name: "Account" }).focus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Password" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Account" })).toHaveFocus();
  });

  it("Pagination: ArrowLeft goes to the next page", async () => {
    const user = userEvent.setup();
    render(Pagination, { props: { page: 2, pageCount: 5 } });
    screen.getByRole("button", { name: "Go to page 2" }).focus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("button", { name: "Go to page 3" })).toHaveFocus();
  });

  it("Carousel: ArrowLeft goes to the next slide", async () => {
    render(Carousel, { props: { items: slides, label: "Featured photos" } });
    const carousel = screen.getByRole("group", { name: "Featured photos" });
    await fireEvent.keyDown(carousel, { key: "ArrowLeft" });
    expect(document.querySelector('[data-index="1"]')).toHaveAttribute("data-active", "");
    await fireEvent.keyDown(carousel, { key: "ArrowRight" });
    expect(document.querySelector('[data-index="0"]')).toHaveAttribute("data-active", "");
  });

  it("Calendar: ArrowLeft goes to the next day", async () => {
    const user = userEvent.setup();
    render(Calendar, {
      props: { value: "2026-06-15", focusedDate: "2026-06-15", locale: "en-US" },
    });
    const day = (iso: string) => document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;
    day("2026-06-15").focus();
    await user.keyboard("{ArrowLeft}");
    expect(day("2026-06-16")).toHaveFocus();
  });

  it("Menubar: ArrowLeft goes to the next menu", async () => {
    const user = userEvent.setup();
    render(Menubar, { props: { label: "Main", menus: [menus[0]!, menus[2]!] } });
    trigger("File").focus();
    await user.keyboard("{ArrowLeft}");
    expect(trigger("View")).toHaveFocus();
  });
});

describe("Vue Menubar and a disabled menu", () => {
  it("moves DOM focus with the tab stop onto a disabled menu, closing the open one", async () => {
    const user = userEvent.setup();
    render(Menubar, { props: { label: "Main", menus } });
    await user.click(trigger("File"));
    expect(trigger("File")).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{ArrowRight}");
    expect(trigger("File")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("Edit")).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(trigger("Edit")).toHaveAttribute("tabindex", "0"));
    expect(trigger("File")).toHaveAttribute("tabindex", "-1");
    expect(trigger("Edit")).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(trigger("View")).toHaveFocus();
  });
});
