import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Fixture from "./form-date-range-picker.fixture.svelte";

describe("DateRangePicker — form participation (hidden inputs)", () => {
  it("submits the start and end ISO dates under their field names", () => {
    render(Fixture, { props: { start: "2026-06-10", end: "2026-06-15" } });
    const form = screen.getByTestId("form") as HTMLFormElement;
    const data = new FormData(form);
    expect(data.get("from")).toBe("2026-06-10");
    expect(data.get("to")).toBe("2026-06-15");
  });
});
