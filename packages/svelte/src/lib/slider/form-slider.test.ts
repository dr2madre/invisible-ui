import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Fixture from "./form-slider.fixture.svelte";

// Built on a native range input: the value participates in a real <form>.
describe("Slider — native form participation", () => {
  it("submits the current value under the field name", async () => {
    render(Fixture, { props: { value: 30 } });
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("volume")).toBe("30");

    await fireEvent.input(screen.getByRole("slider"), { target: { value: "70" } });
    expect(new FormData(form).get("volume")).toBe("70");
  });
});
