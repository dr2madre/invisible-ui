import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Fixture from "./form-switch.fixture.svelte";

// Built on a native checkbox: the value participates in a real <form> with no
// wiring (submitted only when the switch is on).
describe("Switch — native form participation", () => {
  it("omits the value when off and submits it when on", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const form = screen.getByTestId("form") as HTMLFormElement;

    expect(new FormData(form).get("wifi")).toBeNull();

    await user.click(screen.getByRole("switch", { name: "Wi-Fi" }));
    expect(new FormData(form).get("wifi")).toBe("on");
  });
});
