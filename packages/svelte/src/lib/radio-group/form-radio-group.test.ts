import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Fixture from "./form-radio-group.fixture.svelte";

// Native radios participate in a real <form> with no wiring: the selected
// value is submitted under the shared name.
describe("RadioGroup — native form participation", () => {
  it("submits the selected value under the group name", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { value: "free" } });
    const form = screen.getByTestId("form") as HTMLFormElement;

    expect(new FormData(form).get("plan")).toBe("free");

    await user.click(screen.getByRole("radio", { name: "Pro" }));
    expect(new FormData(form).get("plan")).toBe("pro");
  });

  it("submits nothing until a choice is made", () => {
    render(Fixture);
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("plan")).toBeNull();
  });
});
