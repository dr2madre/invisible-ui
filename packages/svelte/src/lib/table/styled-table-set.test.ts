import { fireEvent, render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./table-set.fixture.svelte";

const bodyNames = () =>
  Array.from(document.querySelectorAll("tbody tr td:first-child")).map((c) => c.textContent);

describe("Svelte TableSet (composed)", () => {
  it("renders a titled set with the table inside, sorted by default", () => {
    render(Fixture);
    expect(screen.getByRole("heading", { name: "People" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "People" })).toBeInTheDocument();
    // There is always an active sort: defaults to the first sortable column (name) ascending.
    expect(bodyNames()).toEqual(["Ada", "alan", "Barbara", "Edsger", "Grace"]);
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
  });

  it("toggles a sortable header between ascending and descending (never unsorted)", async () => {
    render(Fixture);
    const nameButton = within(screen.getByRole("columnheader", { name: /Name/ })).getByRole(
      "button",
    );
    // Default is ascending; first click flips to descending.
    await fireEvent.click(nameButton);
    expect(bodyNames()).toEqual(["Grace", "Edsger", "Barbara", "alan", "Ada"]);
    // Second click returns to ascending — it never cycles to "no sort".
    await fireEvent.click(nameButton);
    expect(bodyNames()).toEqual(["Ada", "alan", "Barbara", "Edsger", "Grace"]);
  });

  describe("pagination", () => {
    it("pages the sorted rows and shows a pager", () => {
      render(Fixture, { props: { pageSize: 2 } });
      expect(bodyNames()).toEqual(["Ada", "alan"]);
      expect(screen.getByRole("navigation", { name: "Table pages" })).toBeInTheDocument();
    });

    it("navigates to the next page", async () => {
      render(Fixture, { props: { pageSize: 2 } });
      await fireEvent.click(screen.getByRole("button", { name: "Go to page 2" }));
      expect(bodyNames()).toEqual(["Barbara", "Edsger"]);
    });
  });

  describe("column visibility config", () => {
    it("hides a column when its checkbox is toggled off in the dropdown", async () => {
      render(Fixture, { props: { configurable: true } });
      expect(screen.getByRole("columnheader", { name: "City" })).toBeInTheDocument();
      await fireEvent.click(screen.getByRole("button", { name: "Columns" }));
      const cityToggle = screen.getByRole("checkbox", { name: "City" });
      expect(cityToggle).toBeChecked();
      await fireEvent.click(cityToggle);
      expect(screen.queryByRole("columnheader", { name: "City" })).not.toBeInTheDocument();
    });

    it("keeps non-hideable columns even if their toggle is clicked", async () => {
      render(Fixture, { props: { configurable: true } });
      await fireEvent.click(screen.getByRole("button", { name: "Columns" }));
      await fireEvent.click(screen.getByRole("checkbox", { name: "Name" }));
      expect(screen.getByRole("columnheader", { name: /Name/ })).toBeInTheDocument();
    });
  });

  describe("view switching", () => {
    it("renders cards in card view", () => {
      render(Fixture, { props: { view: "card" } });
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      expect(screen.getByRole("list", { name: "People" })).toBeInTheDocument();
      expect(screen.getAllByRole("listitem")).toHaveLength(5);
    });

    it("switches from table to cards via the segmented control", async () => {
      render(Fixture, { props: { allowViewToggle: true } });
      expect(screen.getByRole("table")).toBeInTheDocument();
      await fireEvent.click(screen.getByRole("radio", { name: "Cards" }));
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      expect(screen.getByRole("list", { name: "People" })).toBeInTheDocument();
    });
  });

  describe("infinite scroll", () => {
    it("renders all rows (no pager) and a load-more button when there's more", () => {
      render(Fixture, { props: { infinite: true, hasMore: true } });
      expect(bodyNames()).toHaveLength(5); // every row, not a page
      expect(screen.queryByRole("navigation", { name: "Table pages" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Load more" })).toBeInTheDocument();
    });

    it("calls onLoadMore when the load-more button is clicked", async () => {
      const onLoadMore = vi.fn();
      render(Fixture, { props: { infinite: true, hasMore: true, onLoadMore } });
      await fireEvent.click(screen.getByRole("button", { name: "Load more" }));
      expect(onLoadMore).toHaveBeenCalledOnce();
    });

    it("hides the button and shows a status while loading", () => {
      render(Fixture, { props: { infinite: true, hasMore: true, loading: true } });
      expect(screen.getByRole("button", { name: "Loading…" })).toBeDisabled();
      expect(screen.getByRole("status")).toHaveTextContent("Loading…");
    });

    it("shows no load-more button when there is nothing more", () => {
      render(Fixture, { props: { infinite: true, hasMore: false } });
      expect(screen.queryByRole("button", { name: /Load more/ })).not.toBeInTheDocument();
    });
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { pageSize: 2, configurable: true } });
    expect(await axe(container)).toHaveNoViolations();
  });
});

// Task 5A: the controllable-mirror contract. A later prop change updates the
// rendered set without a remount; reflecting a prop never calls a callback;
// a user action calls its callback exactly once. These tests fail if the
// read-once initialization is reinstated.
describe("Svelte TableSet (controlled sync)", () => {
  const header = (name: string) => screen.getByRole("columnheader", { name });
  const spies = () => ({
    onPageChange: vi.fn(),
    onSortChange: vi.fn(),
    onHiddenColumnsChange: vi.fn(),
  });

  it("follows a later sort prop without a callback", async () => {
    const callbacks = spies();
    const { rerender } = render(Fixture, {
      props: { sort: { key: "name", direction: "asc" }, ...callbacks },
    });
    expect(header("Name")).toHaveAttribute("aria-sort", "ascending");

    await rerender({ sort: { key: "age", direction: "desc" }, ...callbacks });
    expect(header("Age")).toHaveAttribute("aria-sort", "descending");
    expect(callbacks.onSortChange).not.toHaveBeenCalled();
  });

  it("follows a later hiddenColumns prop without a callback", async () => {
    const callbacks = spies();
    const { rerender } = render(Fixture, { props: { configurable: true, ...callbacks } });
    expect(screen.queryByRole("columnheader", { name: "City" })).not.toBeNull();

    await rerender({ configurable: true, hiddenColumns: ["city"], ...callbacks });
    expect(screen.queryByRole("columnheader", { name: "City" })).toBeNull();
    expect(callbacks.onHiddenColumnsChange).not.toHaveBeenCalled();

    await rerender({ configurable: true, hiddenColumns: [], ...callbacks });
    expect(screen.queryByRole("columnheader", { name: "City" })).not.toBeNull();
  });

  it("keeps a hidden key that is temporarily absent from the columns", async () => {
    const callbacks = spies();
    const withoutCity = [
      { key: "name", header: "Name", sortable: true, hideable: false },
      { key: "age", header: "Age", sortable: true },
    ];
    const { rerender } = render(Fixture, {
      props: { configurable: true, hiddenColumns: ["city"], ...callbacks },
    });

    await rerender({
      configurable: true,
      hiddenColumns: ["city"],
      columns: withoutCity,
      ...callbacks,
    });
    expect(screen.queryByRole("columnheader", { name: "City" })).toBeNull();

    // The city column returns: still hidden, because its key was never dropped.
    const withCity = [...withoutCity, { key: "city", header: "City" }];
    await rerender({
      configurable: true,
      hiddenColumns: ["city"],
      columns: withCity,
      ...callbacks,
    });
    expect(screen.queryByRole("columnheader", { name: "City" })).toBeNull();
    expect(callbacks.onHiddenColumnsChange).not.toHaveBeenCalled();
  });

  it("keeps the current sort when new columns still carry it, else falls back", async () => {
    const callbacks = spies();
    const { rerender } = render(Fixture, {
      props: { sort: { key: "age", direction: "desc" }, ...callbacks },
    });
    expect(header("Age")).toHaveAttribute("aria-sort", "descending");

    // Age survives the new column list: the sort is preserved.
    const reordered = [
      { key: "age", header: "Age", sortable: true },
      { key: "name", header: "Name", sortable: true, hideable: false },
    ];
    await rerender({ sort: { key: "age", direction: "desc" }, columns: reordered, ...callbacks });
    expect(header("Age")).toHaveAttribute("aria-sort", "descending");

    // The sorted column disappears: first sortable column, ascending, no callback.
    const withoutAge = [
      { key: "name", header: "Name", sortable: true, hideable: false },
      { key: "city", header: "City", sortable: true },
    ];
    await rerender({ sort: { key: "age", direction: "desc" }, columns: withoutAge, ...callbacks });
    expect(header("Name")).toHaveAttribute("aria-sort", "ascending");
    expect(callbacks.onSortChange).not.toHaveBeenCalled();
  });

  it("follows a later page prop without a callback", async () => {
    const callbacks = spies();
    const { rerender } = render(Fixture, { props: { pageSize: 2, page: 1, ...callbacks } });
    // Sorted by name asc: Ada, alan | Barbara, Edsger | Grace.
    expect(screen.getByRole("table")).toHaveTextContent("Ada");

    await rerender({ pageSize: 2, page: 3, ...callbacks });
    expect(screen.getByRole("table")).toHaveTextContent("Grace");
    expect(screen.getByRole("table")).not.toHaveTextContent("Ada");
    // The pager reflects the controlled page too.
    expect(screen.getByRole("button", { name: "Go to page 3" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(callbacks.onPageChange).not.toHaveBeenCalled();
  });

  it("follows a later table/card view prop", async () => {
    const { rerender } = render(Fixture, { props: {} });
    expect(screen.getByRole("table")).toBeInTheDocument();

    await rerender({ view: "card" });
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByRole("list")).toBeInTheDocument();

    await rerender({ view: "table" });
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("clamps once when the rows shrink, reporting one page change", async () => {
    const callbacks = spies();
    const twoRows = [
      { id: 1, name: "Ada", age: 36, city: "London" },
      { id: 2, name: "Grace", age: 85, city: "New York" },
    ];
    const { rerender } = render(Fixture, { props: { pageSize: 2, page: 3, ...callbacks } });
    expect(callbacks.onPageChange).not.toHaveBeenCalled();

    await rerender({ pageSize: 2, page: 3, rows: twoRows, ...callbacks });
    expect(callbacks.onPageChange).toHaveBeenCalledTimes(1);
    expect(callbacks.onPageChange).toHaveBeenCalledWith(1);
    expect(screen.getByRole("table")).toHaveTextContent("Ada");

    // An unrelated rerender with the same, still out-of-range page prop must
    // not reapply it or notify again.
    await rerender({ pageSize: 2, page: 3, rows: twoRows, caption: "People", ...callbacks });
    expect(callbacks.onPageChange).toHaveBeenCalledTimes(1);
  });

  it("keeps a local interaction across an unrelated rerender", async () => {
    const callbacks = spies();
    const { rerender } = render(Fixture, { props: { ...callbacks } });

    await userEvent.setup().click(within(header("Age")).getByRole("button"));
    expect(header("Age")).toHaveAttribute("aria-sort", "ascending");
    expect(callbacks.onSortChange).toHaveBeenCalledTimes(1);

    // Unrelated prop changes; the sort prop stays the same (null).
    await rerender({ caption: "People again", ...callbacks });
    expect(header("Age")).toHaveAttribute("aria-sort", "ascending");
    expect(callbacks.onSortChange).toHaveBeenCalledTimes(1);
  });

  it("calls only the replacement callback after a callback prop change", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(Fixture, { props: { onSortChange: first } });

    await user.click(within(header("Age")).getByRole("button"));
    expect(first).toHaveBeenCalledTimes(1);

    await rerender({ onSortChange: second });
    await user.click(within(header("Age")).getByRole("button"));
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("does not remount the view when data props change", async () => {
    const { rerender } = render(Fixture, { props: {} });
    const marker = screen.getByRole("table");
    marker.setAttribute("data-probe", "alive");

    await rerender({
      rows: [{ id: 9, name: "Katherine", age: 101, city: "Hampton" }],
    });
    expect(screen.getByRole("table")).toHaveAttribute("data-probe", "alive");
    expect(screen.getByRole("table")).toHaveTextContent("Katherine");
  });
});
