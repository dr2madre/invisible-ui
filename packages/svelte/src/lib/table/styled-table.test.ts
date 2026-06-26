import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./table.fixture.svelte";

const bodyNames = () =>
  Array.from(document.querySelectorAll("tbody tr td:first-child")).map((c) => c.textContent);

describe("Svelte Table (pure grid)", () => {
  it("renders a captioned table with column headers and the rows it is given", () => {
    render(Fixture);
    expect(screen.getByRole("table", { name: "People" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Name/ })).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(4); // header + 3 rows
    expect(bodyNames()).toEqual(["Ada", "Grace", "alan"]); // exactly as passed (controlled)
  });

  it("reflects the controlled sort on the headers and leaves non-sortable ones bare", () => {
    render(Fixture, { props: { sort: { key: "name", direction: "asc" } } });
    expect(screen.getByRole("columnheader", { name: /Name/ })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    expect(screen.getByRole("columnheader", { name: /Age/ })).toHaveAttribute("aria-sort", "none");
    expect(screen.getByRole("columnheader", { name: "City" })).not.toHaveAttribute("aria-sort");
  });

  it("emits onSortToggle with the column key when a sortable header is activated", async () => {
    const onSortToggle = vi.fn();
    render(Fixture, { props: { onSortToggle } });
    await fireEvent.click(
      within(screen.getByRole("columnheader", { name: /Name/ })).getByRole("button"),
    );
    expect(onSortToggle).toHaveBeenCalledWith("name");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { sort: { key: "name", direction: "asc" } } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
