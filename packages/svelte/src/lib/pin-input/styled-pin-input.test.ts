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
    await user.click(screen.getAllByRole("textbox")[0]!);
    await user.paste("9876");
    expect(onComplete).toHaveBeenCalledWith("9876");
  });

  it("moves the arrows by the layout direction", async () => {
    const user = userEvent.setup();
    const target = document.body.appendChild(document.createElement("div"));
    target.dir = "rtl";
    render(PinInput, { target, props: { length: 4, label: "One-time code" } });
    const cells = screen.getAllByRole("textbox");
    cells[1]!.focus();
    await user.keyboard("{ArrowLeft}");
    expect(cells[2]).toHaveFocus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(cells[0]).toHaveFocus();
    target.remove();
  });

  it("keeps the left-to-right arrows", async () => {
    const user = userEvent.setup();
    render(PinInput, { props: { length: 4, label: "One-time code" } });
    const cells = screen.getAllByRole("textbox");
    cells[1]!.focus();
    await user.keyboard("{ArrowRight}");
    expect(cells[2]).toHaveFocus();
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(cells[0]).toHaveFocus();
  });

  it("takes typed Arabic-Indic digits and reports ASCII", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(PinInput, { props: { length: 4, label: "One-time code", onValueChange } });
    const cells = screen.getAllByRole("textbox");
    await user.click(cells[0]!);
    await user.keyboard("١٢");
    expect((cells[0] as HTMLInputElement).value).toBe("1");
    expect((cells[1] as HTMLInputElement).value).toBe("2");
    expect(onValueChange).toHaveBeenLastCalledWith("12");
  });

  it("takes pasted Persian digits and reports ASCII", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onComplete = vi.fn();
    render(PinInput, { props: { length: 4, label: "One-time code", onValueChange, onComplete } });
    const cells = screen.getAllByRole("textbox");
    await user.click(cells[0]!);
    await user.paste("۹۸۷۶");
    expect(cells.map((cell) => (cell as HTMLInputElement).value)).toEqual(["9", "8", "7", "6"]);
    expect(onValueChange).toHaveBeenLastCalledWith("9876");
    expect(onComplete).toHaveBeenCalledWith("9876");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(PinInput, { props: { length: 4, label: "One-time code" } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
