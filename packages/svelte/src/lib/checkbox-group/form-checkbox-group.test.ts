import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Fixture from "./form-checkbox-group.fixture.svelte";

// Every checked item submits its value under the shared name, exactly like a
// hand-written set of native checkboxes.
describe("CheckboxGroup — native form participation", () => {
  it("submits every checked item's value under the shared name", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { value: ["email"] } });
    const form = screen.getByTestId("form") as HTMLFormElement;

    expect(new FormData(form).getAll("notifications")).toEqual(["email"]);

    await user.click(screen.getByRole("checkbox", { name: "Push" }));
    expect(new FormData(form).getAll("notifications")).toEqual(["email", "push"]);
  });
});
