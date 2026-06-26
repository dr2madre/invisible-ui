import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Fixture from "./form-time-field.fixture.svelte";

describe("TimeField — form participation (hidden input)", () => {
  it("submits the formatted time under the field name", () => {
    render(Fixture, { props: { value: "09:30" } });
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("time")).toBe("09:30");
  });
});
