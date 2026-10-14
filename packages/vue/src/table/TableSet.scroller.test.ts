import { render, screen } from "@testing-library/vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { defineComponent, h } from "vue";
import { LocaleProvider } from "../i18n/i18n";
import { TableSet } from "./TableSet";
import type { TableColumnDef, TableRow } from "./Table";

const columns: TableColumnDef[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "city", header: "City" },
];
const rows: TableRow[] = [{ id: 1, name: "Ada", city: "London" }];

// jsdom has no layout: the measure comes from these two getters.
const measure = (scrollWidth: number, clientWidth: number) => {
  vi.spyOn(Element.prototype, "scrollWidth", "get").mockReturnValue(scrollWidth);
  vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(clientWidth);
};

const card = () => document.querySelector<HTMLElement>(".table-view__card")!;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Vue TableSet: a table wider than its card", () => {
  it("scrolls inside a focusable region named after the table", async () => {
    measure(900, 300);
    const { container } = render(TableSet, {
      props: { columns, rows, caption: "People", title: "Team" },
    });
    await Promise.resolve();
    expect(card()).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("region", { name: "Team" })).toBe(card());
    expect(await axe(container)).toHaveNoViolations();
  });

  it("names the region after the caption without a title", async () => {
    measure(900, 300);
    render(TableSet, { props: { columns, rows, caption: "People" } });
    await Promise.resolve();
    expect(screen.getByRole("region", { name: "People" })).toBe(card());
  });

  it("stays out of the tab order while the table fits", async () => {
    measure(300, 300);
    const { container } = render(TableSet, { props: { columns, rows, caption: "People" } });
    await Promise.resolve();
    expect(card()).not.toHaveAttribute("tabindex");
    expect(card()).not.toHaveAttribute("role");
    expect(card()).not.toHaveAttribute("aria-label");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("falls back to the catalog's name when the table has no caption or title", async () => {
    measure(900, 300);
    const Fixture = defineComponent({
      setup: () => () =>
        h(LocaleProvider, { locale: "it", messages: { "table.viewTable": "Tabella" } }, () =>
          h(TableSet, { columns, rows }),
        ),
    });
    render(Fixture);
    await Promise.resolve();
    expect(screen.getByRole("region", { name: "Tabella" })).toBe(card());
  });
});
