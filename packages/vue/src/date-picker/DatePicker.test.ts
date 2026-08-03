import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { DatePicker } from "./DatePicker";

// The popover teleports to document.body, so the axe scan covers the whole
// page; the landmark (region) rule judges the bare fixture's page structure,
// not the component, and is off here.
const noAxeRegion = { rules: { region: { enabled: false } } };

const renderPicker = (props: Record<string, unknown> = {}) =>
  render(DatePicker, { props: { label: "Event date", locale: "en-US", ...props } });

const field = () => screen.getByRole("combobox", { name: "Event date" });
const dayButton = (iso: string) =>
  document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;

describe("Vue DatePicker (styled)", () => {
  it("renders a readonly field with the label and placeholder", () => {
    renderPicker();
    const input = field();
    expect(input).toHaveAttribute("readonly");
    expect(input).toHaveAttribute("placeholder", "Select a date");
    expect(input).toHaveValue("");
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("shows a preselected value formatted with Intl", () => {
    renderPicker({ value: "2026-06-15" });
    expect(field()).toHaveValue("Jun 15, 2026");
  });

  it("opens the calendar and picks a day, filling the field and closing", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderPicker({ value: "2026-06-15", onValueChange });

    await user.click(field());
    expect(screen.getByRole("grid")).toBeInTheDocument();

    await user.click(dayButton("2026-06-20"));
    expect(onValueChange).toHaveBeenCalledWith("2026-06-20");
    expect(field()).toHaveValue("Jun 20, 2026");
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("emits update:modelValue so the date binds with v-model", async () => {
    const user = userEvent.setup();
    const { emitted } = render(DatePicker, {
      props: { label: "Event date", locale: "en-US", modelValue: "2026-06-15" },
    });
    await user.click(field());
    await user.click(dayButton("2026-06-20"));
    expect(emitted()["update:modelValue"]).toEqual([["2026-06-20"]]);
  });

  it("clears the value via the clear button", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderPicker({ value: "2026-06-15", clearable: true, onValueChange });

    await user.click(screen.getByRole("button", { name: "Clear date" }));
    expect(onValueChange).toHaveBeenCalledWith(null);
    expect(field()).toHaveValue("");
  });

  it("forwards min/max so out-of-range days are disabled", async () => {
    const user = userEvent.setup();
    renderPicker({ value: "2026-06-15", min: "2026-06-10", max: "2026-06-20" });
    await user.click(field());
    expect(dayButton("2026-06-05")).toHaveAttribute("data-disabled", "");
  });

  it("stays closed while disabled", async () => {
    const user = userEvent.setup();
    renderPicker({ value: "2026-06-15", disabled: true });
    await user.click(field());
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("submits the selected ISO date under the field name", () => {
    render({
      render: () =>
        h("form", { "data-testid": "form" }, [
          h(DatePicker, { label: "Due date", name: "due", value: "2026-06-15" }),
        ]),
    });
    const form = screen.getByTestId("form") as HTMLFormElement;
    expect(new FormData(form).get("due")).toBe("2026-06-15");
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    renderPicker({ value: "2026-06-15" });
    await user.click(field());
    expect(await axe(document.body, noAxeRegion)).toHaveNoViolations();
  });
});
