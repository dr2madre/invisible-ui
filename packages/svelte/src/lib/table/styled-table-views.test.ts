import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
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
