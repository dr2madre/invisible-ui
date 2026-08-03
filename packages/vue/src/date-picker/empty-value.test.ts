import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DatePicker } from "./DatePicker";
import { DateRangePicker } from "../date-range-picker/DateRangePicker";

describe("Vue DatePicker bound to an empty value", () => {
  it("opens its calendar when the model starts as an empty string", async () => {
    const user = userEvent.setup();
    render(DatePicker, { props: { label: "Departure", locale: "en-US", modelValue: "" } });
    await user.click(screen.getByRole("combobox", { name: "Departure" }));
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });
});

describe("Vue DateRangePicker bound to empty values", () => {
  it("opens its calendar when both ends start as empty strings", async () => {
    const user = userEvent.setup();
    render(DateRangePicker, {
      props: { label: "Stay", locale: "en-US", start: "", end: "" },
    });
    await user.click(screen.getByRole("combobox", { name: "Stay" }));
    expect(screen.getAllByRole("grid").length).toBeGreaterThan(0);
  });
});
