import { fireEvent, render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./table-views.fixture.svelte";

describe("Svelte TableSet — tabs as distinct views", () => {
  it("renders a tablist of the views with the first one active", () => {
    render(Fixture);
    expect(screen.getByRole("tablist", { name: "Data views" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "People" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Orders" })).toBeInTheDocument();
    // First view's columns are shown.
    expect(screen.getByRole("columnheader", { name: /Name/ })).toBeInTheDocument();
    expect(screen.getByText("Ada")).toBeInTheDocument();
  });

  it("swaps the whole table (columns + rows) when another tab is selected", async () => {
    render(Fixture);
    await fireEvent.click(screen.getByRole("tab", { name: "Orders" }));
    // The orders view has its own columns and rows.
    expect(screen.getByRole("columnheader", { name: /Reference/ })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /Name/ })).not.toBeInTheDocument();
    expect(screen.getByText("A1")).toBeInTheDocument();
    expect(screen.queryByText("Ada")).not.toBeInTheDocument();
  });

  it("keeps each view's sort independent (state resets on switch)", async () => {
    render(Fixture);
    // Default sort is name ascending; one click flips it to descending.
    const nameButton = within(screen.getByRole("columnheader", { name: /Name/ })).getByRole(
      "button",
    );
    await fireEvent.click(nameButton); // asc -> desc
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
    await fireEvent.click(screen.getByRole("tab", { name: "Orders" }));
    await fireEvent.click(screen.getByRole("tab", { name: "People" }));
    // Remounted fresh: the sort is back to the default (name ascending).
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container)).toHaveNoViolations();
  });
});

// Task 5A: views and the active id are controllable mirrors. These tests fail
// if the read-once initialization is reinstated.
describe("Svelte TableSet (controlled views)", () => {
  const tab = (name: string) => screen.getByRole("tab", { name });

  const makeViews = () => [
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
      columns: [{ key: "ref", header: "Reference", sortable: true }],
      rows: [{ id: "A1", ref: "A1" }],
    },
  ];

  it("follows a later activeView prop without onViewChange", async () => {
    const onViewChange = vi.fn();
    const { rerender } = render(Fixture, { props: { activeView: "people", onViewChange } });
    expect(tab("People")).toHaveAttribute("aria-selected", "true");

    await rerender({ activeView: "orders", onViewChange });
    expect(tab("Orders")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("columnheader", { name: "Reference" })).toBeInTheDocument();
    expect(onViewChange).not.toHaveBeenCalled();
  });

  it("updates label, caption, columns and rows when views are replaced", async () => {
    const { rerender } = render(Fixture, { props: { views: makeViews() } });
    expect(tab("People")).toBeInTheDocument();

    const renamed = makeViews();
    renamed[0] = {
      ...renamed[0]!,
      label: "Humans",
      caption: "Everyone",
      columns: [{ key: "name", header: "Full name", sortable: true }],
      rows: [{ id: 3, name: "Katherine" }],
    };
    await rerender({ views: renamed });

    // Same id: still the active view, updated in place.
    expect(tab("Humans")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("columnheader", { name: "Full name" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Everyone" })).toHaveTextContent("Katherine");
  });

  it("falls back to the first remaining view when the active one is removed", async () => {
    const onViewChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(Fixture, { props: { views: makeViews(), onViewChange } });

    await user.click(tab("Orders"));
    expect(onViewChange).toHaveBeenCalledTimes(1);
    expect(tab("Orders")).toHaveAttribute("aria-selected", "true");

    const withoutOrders = makeViews().slice(0, 1);
    await rerender({ views: withoutOrders, onViewChange });
    expect(tab("People")).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("tab", { name: "Orders" })).toBeNull();
    // The fallback is a reflection, not a user action.
    expect(onViewChange).toHaveBeenCalledTimes(1);
  });

  it("switches between multi-view and single-view after mount", async () => {
    const { rerender } = render(Fixture, { props: { views: makeViews() } });
    expect(screen.getAllByRole("tab")).toHaveLength(2);

    await rerender({ views: [] });
    expect(screen.queryByRole("tab")).toBeNull();
    // No views left: the single-view input renders (the fixture passes none,
    // so the empty single-view table is acceptable as long as no tabs remain).

    await rerender({ views: makeViews() });
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(tab("People")).toHaveAttribute("aria-selected", "true");
  });

  it("keeps the tabs keyboard-navigable after the views are replaced", async () => {
    const user = userEvent.setup();
    const { rerender } = render(Fixture, { props: { views: makeViews() } });

    const replaced = [
      ...makeViews(),
      {
        id: "logs",
        label: "Logs",
        columns: [{ key: "at", header: "At" }],
        rows: [{ id: "l1", at: "now" }],
      },
    ];
    await rerender({ views: replaced });

    tab("People").focus();
    await user.keyboard("{ArrowRight}");
    expect(tab("Orders")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(tab("Logs")).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(tab("Logs")).toHaveAttribute("aria-selected", "true");
  });
});
