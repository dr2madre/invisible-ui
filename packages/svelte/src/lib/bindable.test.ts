import { fireEvent, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import Fixture from "./bindable.fixture.svelte";

/** Reset resolves one task after the event; wait past it. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

const box = (value: string) =>
  document.querySelector<HTMLInputElement>(`input[name="boxes"][value="${value}"]`)!;

// ADR 0015, phase 2: a controllable prop is `$bindable()`, so `bind:` keeps
// working on the migrated controls, with the ADR 0011 and 0012 rules intact.
describe("bind: on the runes controls", () => {
  it("carries the component's own writes up to the parent", async () => {
    const user = userEvent.setup();
    render(Fixture);

    await user.selectOptions(screen.getByLabelText("Fruit"), "apple");
    await user.type(screen.getByLabelText("Note"), " L.");

    expect(screen.getByTestId("fruit")).toHaveTextContent("apple");
    expect(screen.getByTestId("note")).toHaveTextContent("Ada L.");
  });

  it("puts the bound values back on a form reset, keeping the first default", async () => {
    const user = userEvent.setup();
    render(Fixture);

    await user.selectOptions(screen.getByLabelText("Fruit"), "apple");
    await user.type(screen.getByLabelText("Note"), " L.");
    await user.click(box("b"));

    fireEvent.reset(screen.getByTestId("bound-form"));
    await settled();

    expect(screen.getByTestId("fruit")).toHaveTextContent("pear");
    expect(screen.getByTestId("note")).toHaveTextContent(/^Ada$/);
    expect((screen.getByLabelText("Fruit") as HTMLSelectElement).value).toBe("pear");
    expect((screen.getByLabelText("Note") as HTMLTextAreaElement).value).toBe("Ada");
    expect(box("a").checked).toBe(true);
    expect(box("b").checked).toBe(false);
  });

  it("still reflects a parent change made after a reset wrote the value back", async () => {
    const user = userEvent.setup();
    render(Fixture);

    await user.click(box("b"));
    fireEvent.reset(screen.getByTestId("bound-form"));
    await settled();

    await user.click(screen.getByRole("button", { name: "Pick b" }));

    expect(screen.getByTestId("boxes")).toHaveTextContent(/^b$/);
    expect(box("a").checked).toBe(false);
    expect(box("b").checked).toBe(true);
  });
});
