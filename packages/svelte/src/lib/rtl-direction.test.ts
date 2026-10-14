import { fireEvent, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import CalendarFixture from "./calendar/calendar.fixture.svelte";
import CarouselFixture from "./carousel/carousel.fixture.svelte";
import MenubarFixture from "./menubar/menubar.fixture.svelte";
import Pagination from "./pagination/Pagination.svelte";
import Tabs from "./tabs/Tabs.svelte";

const items = [
  { value: "account", label: "Account", content: "Account settings." },
  { value: "password", label: "Password", content: "Password settings." },
  { value: "team", label: "Team", content: "Team settings." },
];

// The page is right to left, with no locale provider anywhere.
beforeEach(() => {
  document.documentElement.setAttribute("dir", "rtl");
});
afterEach(() => {
  document.documentElement.removeAttribute("dir");
});

describe("Svelte arrows follow the reading direction", () => {
  it("Tabs: ArrowLeft goes to the next tab", async () => {
    const user = userEvent.setup();
    render(Tabs, { props: { items, label: "Settings", value: "account" } });
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
    render(CarouselFixture);
    const carousel = screen.getByRole("group", { name: "Featured photos" });
    await fireEvent.keyDown(carousel, { key: "ArrowLeft" });
    expect(document.querySelectorAll(".carousel__slide")[1]).toHaveAttribute("data-active", "");
    await fireEvent.keyDown(carousel, { key: "ArrowRight" });
    expect(document.querySelectorAll(".carousel__slide")[0]).toHaveAttribute("data-active", "");
  });

  it("Calendar: ArrowLeft goes to the next day", async () => {
    render(CalendarFixture);
    const day = (iso: string) => document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;
    day("2026-06-15").focus();
    await fireEvent.keyDown(day("2026-06-15"), { key: "ArrowLeft" });
    expect(day("2026-06-16")).toHaveFocus();
  });

  it("Menubar: ArrowLeft goes to the next menu", async () => {
    const user = userEvent.setup();
    render(MenubarFixture);
    screen.getByRole("menuitem", { name: "File" }).focus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus();
  });
});

describe("Svelte Menubar and a disabled menu", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("dir");
  });

  it("moves DOM focus with the tab stop onto a disabled menu, closing the open one", async () => {
    const user = userEvent.setup();
    render(MenubarFixture, {
      props: {
        menus: [
          { value: "file", label: "File", items: [{ value: "new", label: "New" }] },
          {
            value: "edit",
            label: "Edit",
            items: [{ value: "undo", label: "Undo" }],
            disabled: true,
          },
          { value: "view", label: "View", items: [{ value: "zoom", label: "Zoom" }] },
        ],
      },
    });
    const trigger = (name: string) => screen.getByRole("menuitem", { name });
    await user.click(trigger("File"));
    expect(trigger("File")).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{ArrowRight}");
    expect(trigger("File")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("Edit")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("Edit")).toHaveAttribute("tabindex", "0");
    expect(trigger("File")).toHaveAttribute("tabindex", "-1");
    expect(trigger("Edit")).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(trigger("View")).toHaveAttribute("aria-expanded", "false");
    expect(trigger("View")).toHaveFocus();
  });
});
