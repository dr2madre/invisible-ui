import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { DateRangePicker } from "./DateRangePicker";

// The popover teleports to document.body, so the axe scan covers the whole
// page; the landmark (region) rule judges the bare fixture's page structure,
// not the component, and is off here.
const noAxeRegion = { rules: { region: { enabled: false } } };

const renderPicker = (props: Record<string, unknown> = {}) =>
  render(DateRangePicker, {
    props: { label: "Stay dates", locale: "en-US", view: "month", ...props },
  });

const field = () => screen.getByRole("combobox", { name: "Stay dates" });
const dayButton = (iso: string) =>
  document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;

describe("Vue DateRangePicker (styled)", () => {
  it("shows a placeholder when empty and a formatted range when set", async () => {
    const { rerender } = renderPicker();
    expect(field()).toHaveValue("");
    expect(field()).toHaveAttribute("placeholder", "Select a range");

    await rerender({ start: "2026-06-10", end: "2026-06-15" });
    expect((field() as HTMLInputElement).value).toMatch(/Jun 10\s*.\s*15, 2026/);
  });

  it("shows a half-open range while only the start is set", () => {
    renderPicker({ start: "2026-06-10" });
    expect(field()).toHaveValue("Jun 10, 2026 – …");
  });

  it("completes a range across two clicks and closes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPicker({ start: "2026-06-10", onChange });

    await user.click(field());
    expect(screen.getByRole("grid")).toBeInTheDocument();

    await user.click(dayButton("2026-06-15"));
    expect(onChange).toHaveBeenCalledWith("2026-06-10", "2026-06-15");
    expect((field() as HTMLInputElement).value).toMatch(/Jun 10\s*.\s*15, 2026/);
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("highlights the endpoints and the days between", async () => {
    const user = userEvent.setup();
    renderPicker({ start: "2026-06-10", end: "2026-06-15" });

    await user.click(field());
    expect(dayButton("2026-06-10")).toHaveAttribute("data-range-start", "");
    expect(dayButton("2026-06-15")).toHaveAttribute("data-range-end", "");
    expect(dayButton("2026-06-12")).toHaveAttribute("data-in-range", "");
    expect(dayButton("2026-06-16")).not.toHaveAttribute("data-in-range");
  });

  it("restarts the range when both ends are already set", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPicker({ start: "2026-06-10", end: "2026-06-15", onChange });

    await user.click(field());
    await user.click(dayButton("2026-06-20"));
    expect(onChange).toHaveBeenCalledWith("2026-06-20", null);
  });

  it("emits update:start and update:end so the range binds with v-model", async () => {
    const user = userEvent.setup();
    const { emitted } = renderPicker({ start: "2026-06-10" });

    await user.click(field());
    await user.click(dayButton("2026-06-15"));
    expect(emitted()["update:start"]).toEqual([["2026-06-10"]]);
    expect(emitted()["update:end"]).toEqual([["2026-06-15"]]);
  });

  it("clears the range via the clear button", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPicker({ start: "2026-06-10", end: "2026-06-15", clearable: true, onChange });

    await user.click(screen.getByRole("button", { name: "Clear range" }));
    expect(onChange).toHaveBeenCalledWith(null, null);
    expect(field()).toHaveValue("");
  });

  it("submits the start and end ISO dates under their field names", () => {
    render({
      render: () =>
        h("form", { "data-testid": "form" }, [
          h(DateRangePicker, {
            label: "Stay",
            startName: "from",
            endName: "to",
            start: "2026-06-10",
            end: "2026-06-15",
          }),
        ]),
    });
    const form = screen.getByTestId("form") as HTMLFormElement;
    const data = new FormData(form);
    expect(data.get("from")).toBe("2026-06-10");
    expect(data.get("to")).toBe("2026-06-15");
  });

  it("has no accessibility violations when open on two months", async () => {
    const user = userEvent.setup();
    renderPicker({ start: "2026-06-10", view: "two-month" });
    await user.click(field());
    expect(await axe(document.body, noAxeRegion)).toHaveNoViolations();
  });
});
