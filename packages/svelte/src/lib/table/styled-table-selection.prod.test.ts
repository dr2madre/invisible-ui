import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import Fixture from "./table-selection.fixture.svelte";

// Production build: `fail` never throws and the documented, unsupported
// fallbacks take over. The dev seam is mocked so both branches are testable.
vi.mock("../internal/dev", () => ({ DEV: false, fail: () => {} }));

describe("Svelte TableSet — row selection production fallbacks", () => {
  it("renders a row without a stable id as not selectable", () => {
    render(Fixture, {
      props: {
        rows: [
          { name: "NoId", age: 1, city: "X" },
          { id: 7, name: "Ada", age: 36, city: "London" },
        ],
      },
    });
    expect(screen.getByRole("checkbox", { name: "Select Ada" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Select NoId" })).not.toBeInTheDocument();
  });

  it("keeps only the first occurrence of a duplicate id selectable", async () => {
    // The duplicate sits on another page, as with server data: the render
    // keys stay unique per page while the selection ids collide.
    render(Fixture, {
      props: {
        pageSize: 2,
        rows: [
          { id: 1, name: "Ada", age: 36, city: "London" },
          { id: 3, name: "alan", age: 41, city: "London" },
          { id: 1, name: "Grace", age: 85, city: "New York" },
        ],
      },
    });
    expect(screen.getByRole("checkbox", { name: "Select Ada" })).toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: "Go to page 2" }));
    expect(screen.getByText("Grace")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Select Grace" })).not.toBeInTheDocument();
  });

  it("names the checkbox after the row id when the label is invalid", () => {
    render(Fixture, { props: { getRowLabel: () => "   " } });
    expect(screen.getByRole("checkbox", { name: "Select 1" })).toBeInTheDocument();
  });
});
