import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
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

describe("React TableSet: a table wider than its card", () => {
  it("scrolls inside a focusable region named after the table", async () => {
    measure(900, 300);
    const { container } = render(
      <TableSet columns={columns} rows={rows} caption="People" title="Team" />,
    );
    expect(card()).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("region", { name: "Team" })).toBe(card());
    expect(await axe(container)).toHaveNoViolations();
  });

  it("names the region after the caption without a title", () => {
    measure(900, 300);
    render(<TableSet columns={columns} rows={rows} caption="People" />);
    expect(screen.getByRole("region", { name: "People" })).toBe(card());
  });

  it("stays out of the tab order while the table fits", async () => {
    measure(300, 300);
    const { container } = render(<TableSet columns={columns} rows={rows} caption="People" />);
    expect(card()).not.toHaveAttribute("tabindex");
    expect(card()).not.toHaveAttribute("role");
    expect(card()).not.toHaveAttribute("aria-label");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("falls back to the catalog's name when the table has no caption or title", () => {
    measure(900, 300);
    render(
      <LocaleProvider locale="it" messages={{ "table.viewTable": "Tabella" }}>
        <TableSet columns={columns} rows={rows} />
      </LocaleProvider>,
    );
    expect(screen.getByRole("region", { name: "Tabella" })).toBe(card());
  });
});
