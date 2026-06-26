import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import PinInput from "./PinInput.svelte";

describe("Svelte PinInput (styled)", () => {
  it("renders the requested number of labelled cells", () => {
    render(PinInput, { props: { length: 4, label: "One-time code" } });
    expect(screen.getByRole("group", { name: "One-time code" })).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(4);
  });

  it("completes when every cell is filled", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(PinInput, { props: { length: 4, label: "One-time code", onComplete } });
    await user.click(screen.getAllByRole("textbox")[0]);
    await user.paste("9876");
    expect(onComplete).toHaveBeenCalledWith("9876");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(PinInput, { props: { length: 4, label: "One-time code" } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
