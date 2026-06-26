import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Fixture from "./form-checkbox.fixture.svelte";

// The point of building on a native <input>: the value participates in a
// real <form>'s FormData with no extra wiring.
describe("Checkbox — native form participation", () => {
  it("omits the value when unchecked and submits it when checked", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const form = screen.getByTestId("form") as HTMLFormElement;

    expect(new FormData(form).get("subscribe")).toBeNull();

    await user.click(screen.getByRole("checkbox", { name: "Subscribe" }));
    expect(new FormData(form).get("subscribe")).toBe("yes");
  });

  it("submits the configured value when initially checked", () => {
    render(Fixture, { props: { checked: true, name: "terms", value: "accepted" } });
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("terms")).toBe("accepted");
  });
});
