import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Fixture from "./form-pin-input.fixture.svelte";

describe("PinInput — native form participation", () => {
  it("submits the combined code under the field name", () => {
    render(Fixture, { props: { value: "123456" } });
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("code")).toBe("123456");
  });
});
