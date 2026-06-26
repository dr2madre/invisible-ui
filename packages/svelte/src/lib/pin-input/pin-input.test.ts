import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./pin-input.fixture.svelte";

describe("Svelte PinInput", () => {
  it("renders a labelled group of cells", () => {
    render(Fixture, { props: { length: 4 } });
    expect(screen.getByRole("group", { name: "Verification code" })).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(4);
  });

  it("fills a cell on input, advances focus, and reports the value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Fixture, { props: { length: 4, onValueChange } });
    const cells = screen.getAllByRole("textbox");

    await user.click(cells[0]);
    await user.keyboard("1");
    expect(onValueChange).toHaveBeenLastCalledWith("1");
    expect(cells[1]).toHaveFocus();
  });

  it("ignores characters outside the numeric type", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Fixture, { props: { length: 4, onValueChange } });
    const cells = screen.getAllByRole("textbox");

    await user.click(cells[0]);
    await user.keyboard("a");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(cells[0]).toHaveValue("");
  });

  it("clears with Backspace and steps back when empty", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { length: 4, value: "12" } });
    const cells = screen.getAllByRole("textbox");

    await user.click(cells[2]);
    await user.keyboard("{Backspace}");
    expect(cells[1]).toHaveFocus();
    expect(cells[1]).toHaveValue("");
  });

  it("distributes a pasted code across the cells", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(Fixture, { props: { length: 4, onComplete } });
    const cells = screen.getAllByRole("textbox");

    await user.click(cells[0]);
    await user.paste("1234");
    expect(onComplete).toHaveBeenCalledWith("1234");
    expect(cells[3]).toHaveValue("4");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { length: 4 } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
