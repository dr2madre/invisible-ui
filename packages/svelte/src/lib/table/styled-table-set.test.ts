import { fireEvent, render, screen, within } from "@testing-library/svelte";
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
