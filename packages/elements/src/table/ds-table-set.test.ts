import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach } from "vitest";
import { axe } from "vitest-axe";
import "../define";
import type { DsTableSet, TableViewDef } from "./ds-table-set";
import { bodyNames, listen, mountSet, setAttr } from "./table-set.fixture";

afterEach(() => {
  document.body.innerHTML = "";
});

const header = (name: string | RegExp) => screen.getByRole("columnheader", { name });
const sortButton = (name: string | RegExp) => within(header(name)).getByRole("button");

describe("<ds-table-set> (composed)", () => {
  it("renders a titled set with the table inside, sorted by default", () => {
    mountSet();
    expect(screen.getByRole("heading", { name: "People" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "People" })).toBeInTheDocument();
    // There is always an active sort: the first sortable column, ascending.
    expect(bodyNames()).toEqual(["Ada", "alan", "Barbara", "Edsger", "Grace"]);
    expect(header(/Name/)).toHaveAttribute("aria-sort", "ascending");
  });

  it("toggles a sortable header between ascending and descending (never unsorted)", async () => {
    const user = userEvent.setup();
    const set = mountSet();
    const onSortChange = listen(set, "sort-change");
    await user.click(sortButton(/Name/));
    expect(bodyNames()).toEqual(["Grace", "Edsger", "Barbara", "alan", "Ada"]);
    expect(onSortChange).toHaveBeenLastCalledWith({ sort: { key: "name", direction: "desc" } });
    await user.click(sortButton(/Name/));
    expect(bodyNames()).toEqual(["Ada", "alan", "Barbara", "Edsger", "Grace"]);
    expect(onSortChange).toHaveBeenCalledTimes(2);
    // The sort button keeps focus across the re-render.
    expect(sortButton(/Name/)).toHaveFocus();
  });

  it("keeps the table's own events inside the set", async () => {
    const user = userEvent.setup();
    const set = mountSet({ attrs: { "page-size": 2 } });
    const inner = [listen(set, "sort-toggle"), listen(set, "change")];
    await user.click(sortButton(/Age/));
    await user.click(screen.getByRole("button", { name: "Go to page 2" }));
    for (const spy of inner) expect(spy).not.toHaveBeenCalled();
  });

  describe("pagination", () => {
    it("pages the sorted rows and shows a pager", () => {
      mountSet({ attrs: { "page-size": 2 } });
      expect(bodyNames()).toEqual(["Ada", "alan"]);
      expect(screen.getByRole("navigation", { name: "Table pages" })).toBeInTheDocument();
    });

    it("navigates to the next page and reports it once", async () => {
      const user = userEvent.setup();
      const set = mountSet({ attrs: { "page-size": 2 } });
      const onPageChange = listen(set, "page-change");
      await user.click(screen.getByRole("button", { name: "Go to page 2" }));
      expect(bodyNames()).toEqual(["Barbara", "Edsger"]);
      expect(onPageChange).toHaveBeenCalledTimes(1);
      expect(onPageChange).toHaveBeenCalledWith({ page: 2 });
    });
  });

  describe("column visibility config", () => {
    it("hides a column when its checkbox is toggled off in the popover", async () => {
      const user = userEvent.setup();
      const set = mountSet({ attrs: { configurable: true } });
      const onHidden = listen(set, "hidden-columns-change");
      expect(header("City")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Columns" }));
      expect(screen.getByRole("dialog", { name: "Columns" })).toBeInTheDocument();
      const cityToggle = screen.getByRole("checkbox", { name: "City" });
      expect(cityToggle).toBeChecked();
      await user.click(cityToggle);
      expect(screen.queryByRole("columnheader", { name: "City" })).not.toBeInTheDocument();
      expect(onHidden).toHaveBeenCalledTimes(1);
      expect(onHidden).toHaveBeenCalledWith({ hiddenColumns: ["city"] });
      expect(screen.getByRole("checkbox", { name: "City" })).toHaveFocus();
    });

    it("keeps non-hideable columns even if their toggle is clicked", async () => {
      const user = userEvent.setup();
      mountSet({ attrs: { configurable: true } });
      await user.click(screen.getByRole("button", { name: "Columns" }));
      const nameToggle = screen.getByRole("checkbox", { name: "Name" });
      expect(nameToggle).toBeDisabled();
      await user.click(nameToggle);
      expect(header(/Name/)).toBeInTheDocument();
    });

    it("moves focus into the popover and returns it to the trigger on Escape", async () => {
      const user = userEvent.setup();
      mountSet({ attrs: { configurable: true } });
      const trigger = screen.getByRole("button", { name: "Columns" });
      await user.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      // Name cannot be hidden, so the first focusable toggle is Age.
      expect(screen.getByRole("checkbox", { name: "Age" })).toHaveFocus();
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(trigger).toHaveFocus();
    });

    it("closes on a press outside", async () => {
      const user = userEvent.setup();
      mountSet({ attrs: { configurable: true } });
      await user.click(screen.getByRole("button", { name: "Columns" }));
      await user.click(screen.getByRole("heading", { name: "People" }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("view switching", () => {
    it("renders cards in card view", () => {
      mountSet({ attrs: { view: "card" } });
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      expect(screen.getByRole("list", { name: "People" })).toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(5);
      // The title column heads each card; the other columns become fields.
      expect(screen.getByRole("heading", { name: "Ada" })).toBeInTheDocument();
      expect(screen.getAllByText("City")).toHaveLength(5);
    });

    it("switches from table to cards via the segmented control", async () => {
      const user = userEvent.setup();
      mountSet({ attrs: { "allow-view-toggle": true } });
      expect(screen.getByRole("radiogroup", { name: "View" })).toBeInTheDocument();
      expect(screen.getByRole("table")).toBeInTheDocument();
      await user.click(screen.getByRole("radio", { name: "Cards" }));
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      expect(screen.getByRole("list", { name: "People" })).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: "Cards" })).toBeChecked();
    });
  });

  describe("infinite scroll", () => {
    it("renders all rows (no pager) and a load-more button when there's more", () => {
      mountSet({ attrs: { infinite: true, "has-more": true } });
      expect(bodyNames()).toHaveLength(5);
      expect(screen.queryByRole("navigation", { name: "Table pages" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Load more" })).toBeInTheDocument();
    });

    it("emits load-more when the load-more button is clicked", async () => {
      const user = userEvent.setup();
      const set = mountSet({ attrs: { infinite: true, "has-more": true } });
      const onLoadMore = listen(set, "load-more");
      await user.click(screen.getByRole("button", { name: "Load more" }));
      expect(onLoadMore).toHaveBeenCalledOnce();
    });

    it("disables the button and shows a status while loading", () => {
      mountSet({ attrs: { infinite: true, "has-more": true, loading: true } });
      expect(screen.getByRole("button", { name: "Loading…" })).toBeDisabled();
      expect(screen.getByRole("status")).toHaveTextContent("Loading…");
    });

    it("shows no load-more button when there is nothing more", () => {
      mountSet({ attrs: { infinite: true } });
      expect(screen.queryByRole("button", { name: /Load more/ })).not.toBeInTheDocument();
    });
  });

  it("renders custom cells as DOM or text, never as markup", () => {
    mountSet({
      props: {
        renderCell: ({ column, value }) => {
          if (column.key !== "city") return String(value);
          const strong = document.createElement("strong");
          strong.textContent = String(value);
          return strong;
        },
        rows: [{ id: 1, name: "<em>Ada</em>", age: 36, city: "London" }],
      },
    });
    expect(screen.getByText("London").tagName).toBe("STRONG");
    expect(document.querySelector("tbody em")).toBeNull();
    expect(screen.getByText("<em>Ada</em>")).toBeInTheDocument();
  });

  it("puts toolbar children in the header", () => {
    const set = document.createElement("ds-table-set") as DsTableSet;
    set.innerHTML = `<button slot="toolbar" type="button">Export</button><p>Ignored</p>`;
    document.body.appendChild(set);
    const toolbarButton = screen.getByRole("button", { name: "Export" });
    expect(toolbarButton.closest(".table-set__header")).not.toBeNull();
    expect(toolbarButton).not.toHaveAttribute("slot");
    expect(screen.queryByText("Ignored")).toBeNull();
  });

  it("has no accessibility violations", async () => {
    mountSet({ attrs: { "page-size": 2, configurable: true, "allow-view-toggle": true } });
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("has no accessibility violations in card view with the popover open", async () => {
    const user = userEvent.setup();
    mountSet({ attrs: { view: "card", configurable: true } });
    await user.click(screen.getByRole("button", { name: "Columns" }));
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

// The controllable-mirror contract (ADR 0011): setting an input updates the
// rendered set without a remount and without an event; a user action emits
// exactly once.
describe("<ds-table-set> (controlled sync)", () => {
  const spies = (set: HTMLElement) => ({
    page: listen(set, "page-change"),
    sort: listen(set, "sort-change"),
    hidden: listen(set, "hidden-columns-change"),
  });

  it("follows a later sort without an event", () => {
    const set = mountSet({ props: { sort: { key: "name", direction: "asc" } } });
    const events = spies(set);
    expect(header(/Name/)).toHaveAttribute("aria-sort", "ascending");
    set.sort = { key: "age", direction: "desc" };
    expect(header(/Age/)).toHaveAttribute("aria-sort", "descending");
    expect(events.sort).not.toHaveBeenCalled();
  });

  it("follows later hidden columns without an event", () => {
    const set = mountSet({ attrs: { configurable: true } });
    const events = spies(set);
    set.hiddenColumns = ["city"];
    expect(screen.queryByRole("columnheader", { name: "City" })).toBeNull();
    set.hiddenColumns = [];
    expect(header("City")).toBeInTheDocument();
    expect(events.hidden).not.toHaveBeenCalled();
  });

  it("keeps a hidden key that is temporarily absent from the columns", () => {
    const set = mountSet({ attrs: { configurable: true }, props: { hiddenColumns: ["city"] } });
    const events = spies(set);
    const withoutCity = [
      { key: "name", header: "Name", sortable: true, hideable: false },
      { key: "age", header: "Age", sortable: true },
    ];
    set.columns = withoutCity;
    expect(screen.queryByRole("columnheader", { name: "City" })).toBeNull();
    // The city column returns: still hidden, because its key was never dropped.
    set.columns = [...withoutCity, { key: "city", header: "City" }];
    expect(screen.queryByRole("columnheader", { name: "City" })).toBeNull();
    expect(events.hidden).not.toHaveBeenCalled();
  });

  it("keeps the current sort when new columns still carry it, else falls back", () => {
    const set = mountSet({ props: { sort: { key: "age", direction: "desc" } } });
    const events = spies(set);
    set.columns = [
      { key: "age", header: "Age", sortable: true },
      { key: "name", header: "Name", sortable: true, hideable: false },
    ];
    expect(header(/Age/)).toHaveAttribute("aria-sort", "descending");
    set.columns = [
      { key: "name", header: "Name", sortable: true, hideable: false },
      { key: "city", header: "City", sortable: true },
    ];
    expect(header(/Name/)).toHaveAttribute("aria-sort", "ascending");
    expect(events.sort).not.toHaveBeenCalled();
  });

  it("follows a later page without an event", () => {
    const set = mountSet({ attrs: { "page-size": 2, page: 1 } });
    const events = spies(set);
    expect(screen.getByRole("table")).toHaveTextContent("Ada");
    set.setAttribute("page", "3");
    expect(screen.getByRole("table")).toHaveTextContent("Grace");
    expect(screen.getByRole("table")).not.toHaveTextContent("Ada");
    expect(screen.getByRole("button", { name: "Go to page 3" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(events.page).not.toHaveBeenCalled();
  });

  it("follows a later table/card view", () => {
    const set = mountSet();
    set.setAttribute("view", "card");
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByRole("list")).toBeInTheDocument();
    set.setAttribute("view", "table");
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("clamps once when the rows shrink, reporting one page change", () => {
    const set = mountSet({ attrs: { "page-size": 2, page: 3 } });
    const events = spies(set);
    set.rows = [
      { id: 1, name: "Ada", age: 36, city: "London" },
      { id: 2, name: "Grace", age: 85, city: "New York" },
    ];
    expect(events.page).toHaveBeenCalledTimes(1);
    expect(events.page).toHaveBeenCalledWith({ page: 1 });
    expect(screen.getByRole("table")).toHaveTextContent("Ada");
    // An unrelated change must not reapply the out-of-range page.
    set.setAttribute("caption", "Same people");
    set.setAttribute("page", "3");
    expect(events.page).toHaveBeenCalledTimes(1);
  });

  it("keeps a local interaction across an unrelated change", async () => {
    const user = userEvent.setup();
    const set = mountSet();
    const events = spies(set);
    await user.click(sortButton(/Age/));
    expect(header(/Age/)).toHaveAttribute("aria-sort", "ascending");
    expect(events.sort).toHaveBeenCalledTimes(1);
    set.setAttribute("caption", "People again");
    set.sort = null;
    expect(header(/Age/)).toHaveAttribute("aria-sort", "ascending");
    expect(events.sort).toHaveBeenCalledTimes(1);
  });

  it("does not remount the view when data changes", () => {
    const set = mountSet();
    // The native table is rebuilt on every render; the view element is not.
    const view = set.querySelector("ds-table-view");
    set.rows = [{ id: 9, name: "Katherine", age: 101, city: "Hampton" }];
    expect(set.querySelector("ds-table-view")).toBe(view);
    expect(screen.getByRole("table")).toHaveTextContent("Katherine");
  });
});

const makeViews = (): TableViewDef[] => [
  {
    id: "people",
    label: "People",
    columns: [
      { key: "name", header: "Name", sortable: true },
      { key: "city", header: "City" },
    ],
    rows: [
      { id: 1, name: "Ada", city: "London" },
      { id: 2, name: "Grace", city: "New York" },
    ],
  },
  {
    id: "orders",
    label: "Orders",
    columns: [
      { key: "ref", header: "Reference", sortable: true },
      { key: "total", header: "Total", sortable: true, align: "end" },
    ],
    rows: [
      { id: "A1", ref: "A1", total: 120 },
      { id: "A2", ref: "A2", total: 80 },
    ],
  },
];

const mountViews = (activeView?: string, views = makeViews()) => {
  const set = document.createElement("ds-table-set") as DsTableSet;
  set.setAttribute("title", "Workspace");
  set.setAttribute("views-label", "Data views");
  setAttr(set, "active-view", activeView);
  set.views = views;
  document.body.appendChild(set);
  return set;
};

const tab = (name: string) => screen.getByRole("tab", { name });

describe("<ds-table-set> (tabs as distinct views)", () => {
  it("renders a tablist of the views with the first one active", () => {
    mountViews();
    expect(screen.getByRole("heading", { name: "Workspace" })).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "Data views" })).toBeInTheDocument();
    expect(tab("People")).toHaveAttribute("aria-selected", "true");
    expect(tab("Orders")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tabpanel", { name: "People" })).toBeInTheDocument();
    expect(header(/Name/)).toBeInTheDocument();
    expect(screen.getByText("Ada")).toBeInTheDocument();
  });

  it("swaps the whole table when another tab is selected, reporting it once", async () => {
    const user = userEvent.setup();
    const set = mountViews();
    const onViewChange = listen(set, "view-change");
    await user.click(tab("Orders"));
    expect(header(/Reference/)).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /Name/ })).not.toBeInTheDocument();
    expect(screen.getByText("A1")).toBeInTheDocument();
    expect(screen.queryByText("Ada")).not.toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Orders" })).toBeInTheDocument();
    expect(onViewChange).toHaveBeenCalledTimes(1);
    expect(onViewChange).toHaveBeenCalledWith({ id: "orders" });
  });

  it("keeps each view's sort independent (state resets on switch)", async () => {
    const user = userEvent.setup();
    mountViews();
    await user.click(sortButton(/Name/));
    expect(header(/Name/)).toHaveAttribute("aria-sort", "descending");
    await user.click(tab("Orders"));
    await user.click(tab("People"));
    expect(header(/Name/)).toHaveAttribute("aria-sort", "ascending");
  });

  it("follows a later active-view without an event", () => {
    const set = mountViews("people");
    const onViewChange = listen(set, "view-change");
    set.setAttribute("active-view", "orders");
    expect(tab("Orders")).toHaveAttribute("aria-selected", "true");
    expect(header("Reference")).toBeInTheDocument();
    expect(onViewChange).not.toHaveBeenCalled();
  });

  it("updates label, caption, columns and rows when views are replaced", () => {
    const set = mountViews();
    const renamed = makeViews();
    renamed[0] = {
      ...renamed[0]!,
      label: "Humans",
      caption: "Everyone",
      columns: [{ key: "name", header: "Full name", sortable: true }],
      rows: [{ id: 3, name: "Katherine" }],
    };
    set.views = renamed;
    expect(tab("Humans")).toHaveAttribute("aria-selected", "true");
    expect(header("Full name")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Everyone" })).toHaveTextContent("Katherine");
  });

  it("falls back to the first remaining view when the active one is removed", async () => {
    const user = userEvent.setup();
    const set = mountViews();
    const onViewChange = listen(set, "view-change");
    await user.click(tab("Orders"));
    expect(onViewChange).toHaveBeenCalledTimes(1);
    set.views = makeViews().slice(0, 1);
    expect(tab("People")).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("tab", { name: "Orders" })).toBeNull();
    expect(onViewChange).toHaveBeenCalledTimes(1);
  });

  it("switches between multi-view and single-view after mount", () => {
    const set = mountViews();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    set.views = [];
    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.getByRole("table")).toBeInTheDocument();
    set.views = makeViews();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(tab("People")).toHaveAttribute("aria-selected", "true");
  });

  it("resolves an invalid active-view at first render to the first view", () => {
    const set = mountViews("ghost");
    const onViewChange = listen(set, "view-change");
    expect(tab("People")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(onViewChange).not.toHaveBeenCalled();
  });

  it("resolves a later invalid active-view to the first view, without an event", () => {
    const set = mountViews("orders");
    const onViewChange = listen(set, "view-change");
    expect(tab("Orders")).toHaveAttribute("aria-selected", "true");
    set.setAttribute("active-view", "ghost");
    expect(tab("People")).toHaveAttribute("aria-selected", "true");
    expect(onViewChange).not.toHaveBeenCalled();
  });

  it("keeps the tabs keyboard-navigable after the views are replaced", async () => {
    const user = userEvent.setup();
    const set = mountViews();
    set.views = [
      ...makeViews(),
      {
        id: "logs",
        label: "Logs",
        columns: [{ key: "at", header: "At" }],
        rows: [{ id: "l1", at: "now" }],
      },
    ];
    tab("People").focus();
    await user.keyboard("{ArrowRight}");
    expect(tab("Orders")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(tab("Logs")).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(tab("Logs")).toHaveAttribute("aria-selected", "true");
  });

  it("has no accessibility violations", async () => {
    mountViews();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
