import type { Mock } from "vitest";
import type { TableColumnDef, TableRow } from "./ds-table";
import type { DsTableSet } from "./ds-table-set";

export const peopleColumns: TableColumnDef[] = [
  { key: "name", header: "Name", sortable: true, hideable: false },
  { key: "age", header: "Age", sortable: true, align: "end" },
  { key: "city", header: "City" },
];

export const peopleRows: TableRow[] = [
  { id: 1, name: "Ada", age: 36, city: "London" },
  { id: 2, name: "Grace", age: 85, city: "New York" },
  { id: 3, name: "alan", age: 41, city: "London" },
  { id: 4, name: "Edsger", age: 60, city: "Rotterdam" },
  { id: 5, name: "Barbara", age: 80, city: "Boston" },
];

export type AttributeValue = string | number | boolean | null | undefined;

/** Write an attribute the way a template would: `true` is present, `false` absent. */
export const setAttr = (element: Element, name: string, value: AttributeValue) => {
  if (value === false || value == null) element.removeAttribute(name);
  else element.setAttribute(name, value === true ? "" : String(value));
};

export interface MountOptions {
  attrs?: Record<string, AttributeValue>;
  props?: Partial<Pick<DsTableSet, keyof DsTableSet>>;
}

/** A titled people set, like the Svelte fixture; options override the defaults. */
export const mountSet = ({ attrs = {}, props = {} }: MountOptions = {}) => {
  const set = document.createElement("ds-table-set") as DsTableSet;
  for (const [name, value] of Object.entries({ title: "People", caption: "People", ...attrs }))
    setAttr(set, name, value);
  set.columns = peopleColumns;
  set.rows = peopleRows;
  Object.assign(set, props);
  document.body.appendChild(set);
  return set;
};

/** A spy that receives each event's detail. */
export const listen = (target: EventTarget, type: string): Mock => {
  const spy = vi.fn();
  target.addEventListener(type, (event) => spy((event as CustomEvent).detail));
  return spy;
};

/** The first data column's text in each body row. */
export const bodyNames = (column = 1) =>
  Array.from(document.querySelectorAll(`tbody tr td:nth-child(${column})`)).map(
    (cell) => cell.textContent,
  );
