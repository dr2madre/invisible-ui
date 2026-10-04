import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Dialog } from "../dialog/Dialog";
import { LocaleProvider } from "../i18n/i18n";
import { DatePicker, type DatePickerProps } from "./DatePicker";

const Fixture = (props: Partial<DatePickerProps>) => (
  <LocaleProvider locale="en-US">
    <DatePicker label="Event date" value="2026-06-15" {...props} />
    <button type="button">after</button>
  </LocaleProvider>
);

const field = (name = "Event date") => screen.getByRole("combobox", { name }) as HTMLInputElement;
const day = (iso: string) => document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

describe("React DatePicker", () => {
  it("renders a readonly combobox with the label and placeholder, closed", () => {
    render(<Fixture value={null} />);
    expect(field()).toHaveAttribute("readonly");
    expect(field()).toHaveAttribute("placeholder", "Select a date");
    expect(field()).toHaveAttribute("aria-haspopup", "dialog");
    expect(field()).toHaveAttribute("aria-expanded", "false");
    expect(field()).toHaveValue("");
    expect(screen.queryByRole("grid")).toBeNull();
  });

  it("shows a preselected value formatted for the locale", () => {
    const { unmount } = render(<Fixture />);
    expect(field()).toHaveValue("Jun 15, 2026");
    unmount();
    render(<DatePicker label="Event date" value="2026-06-15" dateStyle="long" locale="it" />);
    expect(field()).toHaveValue("15 giugno 2026");
  });

  it("treats an empty string as no date", () => {
    render(<Fixture value="" />);
    expect(field()).toHaveValue("");
  });

  it("opens the calendar in a named dialog, with focus on the selected day", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await user.click(field());
    const dialog = screen.getByRole("dialog", { name: "Event date" });
    expect(field()).toHaveAttribute("aria-expanded", "true");
    expect(field()).toHaveAttribute("aria-controls", dialog.id);
    expect(screen.getByRole("grid", { name: "Event date" })).toBeInTheDocument();
    expect(day("2026-06-15")).toHaveFocus();
  });

  it("opens from the keyboard with Enter, Space and ArrowDown, and Escape returns focus", () => {
    render(<Fixture />);
    for (const key of ["Enter", " ", "ArrowDown"]) {
      field().focus();
      fireEvent.keyDown(field(), { key });
      expect(screen.getByRole("grid")).toBeInTheDocument();
      expect(day("2026-06-15")).toHaveFocus();
      fireEvent.keyDown(day("2026-06-15"), { key: "Escape" });
      expect(screen.queryByRole("grid")).toBeNull();
      expect(field()).toHaveFocus();
    }
  });

  it("picks a day with the keyboard, fills the field, closes and returns focus", () => {
    const onValueChange = vi.fn();
    render(<Fixture onValueChange={onValueChange} />);
    field().focus();
    fireEvent.keyDown(field(), { key: "Enter" });
    fireEvent.keyDown(day("2026-06-15"), { key: "ArrowRight" });
    fireEvent.keyDown(day("2026-06-16"), { key: "Enter" });
    expect(onValueChange.mock.calls).toEqual([["2026-06-16"]]);
    expect(field()).toHaveValue("Jun 16, 2026");
    expect(screen.queryByRole("grid")).toBeNull();
    expect(field()).toHaveFocus();
  });

  it("picks a day on click in another month and reports only its own change", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Fixture onValueChange={onValueChange} />);
    await user.click(field());
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(day("2026-07-20"));
    expect(onValueChange.mock.calls).toEqual([["2026-07-20"]]);
    expect(field()).toHaveValue("Jul 20, 2026");
  });

  it("closes on a press outside without moving focus back", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await user.click(field());
    await user.click(screen.getByRole("button", { name: "after" }));
    expect(screen.queryByRole("grid")).toBeNull();
    expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
  });

  it("clears the value with the clear button and keeps focus in the control", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Fixture clearable onValueChange={onValueChange} />);
    await user.click(screen.getByRole("button", { name: "Clear date" }));
    expect(onValueChange.mock.calls).toEqual([[null]]);
    expect(field()).toHaveValue("");
    expect(field()).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Clear date" })).toBeNull();
  });

  it("forwards min and max so out-of-range days are disabled", async () => {
    const user = userEvent.setup();
    render(<Fixture min="2026-06-10" max="2026-06-20" />);
    await user.click(field());
    expect(day("2026-06-05")).toHaveAttribute("data-disabled", "");
  });

  it("stays closed while disabled, with no clear button", async () => {
    const user = userEvent.setup();
    render(<Fixture disabled clearable />);
    await user.click(field());
    expect(screen.queryByRole("grid")).toBeNull();
    expect(screen.queryByRole("button", { name: "Clear date" })).toBeNull();
  });

  it("reflects a controlled value without reporting, and settles on one written back", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender, unmount } = render(<Fixture onValueChange={onValueChange} />);
    rerender(<Fixture value="2026-06-01" onValueChange={onValueChange} />);
    expect(field()).toHaveValue("Jun 1, 2026");
    expect(onValueChange).not.toHaveBeenCalled();
    unmount();

    function PutBack() {
      const [value, setValue] = useState<string | null>("2026-06-15");
      return <Fixture value={value} onValueChange={() => setValue("2026-06-02")} />;
    }
    render(<PutBack />);
    await user.click(field());
    await user.click(day("2026-06-20"));
    expect(field()).toHaveValue("Jun 2, 2026");
  });

  it("takes its labels from the provider's catalog, a label prop still wins", () => {
    const { unmount } = render(
      <LocaleProvider
        locale="it"
        messages={{ "datePicker.label": "Data", "datePicker.clear": "Cancella data" }}
      >
        <DatePicker clearable value="2026-06-15" />
      </LocaleProvider>,
    );
    expect(field("Data")).toHaveValue("15 giu 2026");
    expect(screen.getByRole("button", { name: "Cancella data" })).toBeInTheDocument();
    unmount();
    render(
      <LocaleProvider locale="it" messages={{ "datePicker.label": "Data" }}>
        <DatePicker label="Scadenza" />
      </LocaleProvider>,
    );
    expect(field("Scadenza")).toBeInTheDocument();
  });

  it("renders its popup inside the dialog it sits in", async () => {
    const user = userEvent.setup();
    render(
      <Dialog open title="Book">
        <DatePicker label="Event date" value="2026-06-15" />
      </Dialog>,
    );
    await user.click(field());
    const popup = screen.getByRole("dialog", { name: "Event date" });
    expect(popup.closest("dialog")).not.toBeNull();
  });

  it("has no accessibility violations, closed and open", async () => {
    const user = userEvent.setup();
    render(<Fixture clearable />);
    // The popup is portalled into the body, outside any landmark of the test page.
    const options = { rules: { region: { enabled: false } } };
    expect(await axe(document.body, options)).toHaveNoViolations();
    await user.click(field());
    expect(await axe(document.body, options)).toHaveNoViolations();
  });
});

describe("React DatePicker in a form", () => {
  const Form = (props: Partial<DatePickerProps>) => (
    <LocaleProvider locale="en-US">
      <form>
        <DatePicker label="Due date" name="due" value="2026-06-15" {...props} />
      </form>
    </LocaleProvider>
  );
  const form = () => document.querySelector("form")!;

  it("submits the ISO date under its name, and nothing while disabled", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Form />);
    expect(new FormData(form()).get("due")).toBe("2026-06-15");
    await user.click(field("Due date"));
    await user.click(day("2026-06-20"));
    expect(new FormData(form()).get("due")).toBe("2026-06-20");
    rerender(<Form disabled />);
    expect([...new FormData(form()).keys()]).toEqual([]);
  });

  it("puts the current default back on reset, quietly", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Form onValueChange={onValueChange} />);
    await user.click(field("Due date"));
    await user.click(day("2026-06-20"));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    form().reset();
    await settle();
    expect(field("Due date")).toHaveValue("Jun 15, 2026");
    expect(new FormData(form()).get("due")).toBe("2026-06-15");
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });

  it("treats a page's own value as the new default, and an echo as none", async () => {
    const user = userEvent.setup();
    function Page() {
      const [value, setValue] = useState<string | null>("2026-06-15");
      return (
        <>
          <Form value={value} onValueChange={setValue} />
          <button type="button" onClick={() => setValue("2026-06-01")}>
            set
          </button>
        </>
      );
    }
    render(<Page />);
    await user.click(field("Due date"));
    await user.click(day("2026-06-20"));
    form().reset();
    await settle();
    expect(field("Due date")).toHaveValue("Jun 15, 2026");
    await user.click(screen.getByRole("button", { name: "set" }));
    form().reset();
    await settle();
    expect(field("Due date")).toHaveValue("Jun 1, 2026");
  });
});
