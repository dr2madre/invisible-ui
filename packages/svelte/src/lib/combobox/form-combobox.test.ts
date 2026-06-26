import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Fixture from "./form-combobox.fixture.svelte";

describe("Combobox — form participation (hidden input)", () => {
  it("submits the selected option's value under the field name", () => {
    render(Fixture, { props: { value: "pear" } });
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("fruit")).toBe("pear");
  });
});
