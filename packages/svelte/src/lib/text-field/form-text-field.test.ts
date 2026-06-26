import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Fixture from "./form-text-field.fixture.svelte";

describe("TextField — native form participation", () => {
  it("submits the typed value under the field name", async () => {
    const user = userEvent.setup();
    render(Fixture);
    const form = screen.getByTestId("form") as HTMLFormElement;

    await user.type(screen.getByRole("textbox", { name: "Email" }), "a@b.co");
    expect(new FormData(form).get("email")).toBe("a@b.co");
  });
});
