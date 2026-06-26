import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Fixture from "./form-date-picker.fixture.svelte";

describe("DatePicker — form participation (hidden input)", () => {
  it("submits the selected ISO date under the field name", () => {
    render(Fixture, { props: { value: "2026-06-15" } });
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("due")).toBe("2026-06-15");
  });
});
