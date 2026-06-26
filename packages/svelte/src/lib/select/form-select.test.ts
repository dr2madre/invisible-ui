import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Fixture from "./form-select.fixture.svelte";

describe("Select — form participation (hidden input)", () => {
  it("submits the selected value under the field name", () => {
    render(Fixture, { props: { value: "fr" } });
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("country")).toBe("fr");
  });

  it("submits an empty value when nothing is selected", () => {
    render(Fixture);
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("country")).toBe("");
  });
});
