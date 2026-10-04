import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { LocaleProvider } from "../i18n/i18n";
import { DateRangePicker, type DateRangePickerProps } from "./DateRangePicker";

const Fixture = (props: Partial<DateRangePickerProps>) => (
  <LocaleProvider locale="en-US">
    <DateRangePicker label="Stay" {...props} />
  </LocaleProvider>
);

const field = () => screen.getByRole("combobox", { name: "Stay" }) as HTMLInputElement;
/** The field's text with Intl's thin spaces read as plain ones. */
const shown = () => field().value.replace(/\s/g, " ");
const day = (iso: string) => document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

describe("React DateRangePicker", () => {
  it("shows a placeholder when empty and the formatted range when set", () => {
    const { rerender } = render(<Fixture />);
    expect(field()).toHaveValue("");
    expect(field()).toHaveAttribute("placeholder", "Select a range");
    expect(field()).toHaveClass("date-picker__input--range");
    rerender(<Fixture start="2026-06-10" end="2026-06-14" />);
    expect(shown()).toBe("Jun 10 – 14, 2026");
  });

  it("shows a half-open range while only the start is set", () => {
    render(<Fixture start="2026-06-10" />);
    expect(field()).toHaveValue("Jun 10, 2026 – …");
  });

  it("opens two months in a wide popup, with focus on the start", async () => {
    const user = userEvent.setup();
    render(<Fixture start="2026-06-10" end="2026-06-14" />);
    await user.click(field());
    expect(screen.getAllByRole("grid")).toHaveLength(2);
    expect(document.querySelector(".date-picker__popover--wide")).not.toBeNull();
    expect(day("2026-06-10")).toHaveFocus();
    expect(day("2026-06-12")).toHaveAttribute("data-in-range", "");
  });

  it("completes a range across two picks, then closes and returns focus", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Fixture start="2026-06-10" end="2026-06-14" onChange={onChange} />);
    await user.click(field());
    await user.click(day("2026-06-18"));
    expect(screen.getAllByRole("grid")).toHaveLength(2);
    await user.click(day("2026-06-22"));
    expect(onChange.mock.calls).toEqual([
      ["2026-06-18", null],
      ["2026-06-18", "2026-06-22"],
    ]);
    expect(shown()).toBe("Jun 18 – 22, 2026");
    expect(screen.queryByRole("grid")).toBeNull();
    expect(field()).toHaveFocus();
  });

  it("makes the range with the keyboard alone", () => {
    const onChange = vi.fn();
    render(<Fixture start="2026-06-10" end="2026-06-12" onChange={onChange} />);
    field().focus();
    fireEvent.keyDown(field(), { key: "ArrowDown" });
    fireEvent.keyDown(day("2026-06-10"), { key: "Enter" });
    fireEvent.keyDown(day("2026-06-10"), { key: "ArrowDown" });
    fireEvent.keyDown(day("2026-06-17"), { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith("2026-06-10", "2026-06-17");
    expect(field()).toHaveFocus();
  });

  it("clears the range with the clear button", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Fixture start="2026-06-10" end="2026-06-14" clearable onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "Clear range" }));
    expect(onChange.mock.calls).toEqual([[null, null]]);
    expect(field()).toHaveValue("");
    expect(field()).toHaveFocus();
  });

  it("uses the view prop for the popup's calendar", async () => {
    const user = userEvent.setup();
    render(<Fixture start="2026-06-10" view="month" />);
    await user.click(field());
    expect(screen.getAllByRole("grid")).toHaveLength(1);
  });

  it("formats the range in the provider's locale", () => {
    render(
      <LocaleProvider locale="it">
        <DateRangePicker label="Stay" start="2026-06-10" end="2026-06-14" dateStyle="long" />
      </LocaleProvider>,
    );
    expect(field()).toHaveValue("10–14 giugno 2026");
  });

  it("reflects controlled ends without reporting", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Fixture start="2026-06-10" end="2026-06-14" onChange={onChange} />,
    );
    rerender(<Fixture start="2026-06-01" end="2026-06-03" onChange={onChange} />);
    expect(shown()).toBe("Jun 1 – 3, 2026");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("has no accessibility violations when open on two months", async () => {
    const user = userEvent.setup();
    render(<Fixture start="2026-06-10" end="2026-06-14" />);
    await user.click(field());
    expect(
      await axe(document.body, { rules: { region: { enabled: false } } }),
    ).toHaveNoViolations();
  }, 30_000);
});

describe("React DateRangePicker in a form", () => {
  const Form = (props: Partial<DateRangePickerProps>) => (
    <LocaleProvider locale="en-US">
      <form>
        <DateRangePicker
          label="Stay"
          startName="from"
          endName="to"
          start="2026-06-10"
          end="2026-06-14"
          {...props}
        />
      </form>
    </LocaleProvider>
  );
  const form = () => document.querySelector("form")!;

  it("submits both ISO dates under their names, and nothing while disabled", () => {
    const { rerender } = render(<Form />);
    expect(new FormData(form()).get("from")).toBe("2026-06-10");
    expect(new FormData(form()).get("to")).toBe("2026-06-14");
    rerender(<Form disabled />);
    expect([...new FormData(form()).keys()]).toEqual([]);
  });

  it("puts the current defaults back on reset, quietly", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Form onChange={onChange} />);
    await user.click(field());
    await user.click(day("2026-06-20"));
    await user.click(day("2026-06-24"));
    expect(onChange).toHaveBeenCalledTimes(2);
    form().reset();
    await settle();
    expect(new FormData(form()).get("from")).toBe("2026-06-10");
    expect(new FormData(form()).get("to")).toBe("2026-06-14");
    expect(shown()).toBe("Jun 10 – 14, 2026");
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
