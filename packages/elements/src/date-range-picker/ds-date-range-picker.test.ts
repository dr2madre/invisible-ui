import { fireEvent, screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsDateRangePicker } from "./ds-date-range-picker";

const mount = (attrs = "", lang = "en-US") => {
  document.body.innerHTML = `<main lang="${lang}">
    <ds-date-range-picker label="Stay" ${attrs}></ds-date-range-picker>
  </main>`;
  return document.querySelector("ds-date-range-picker") as DsDateRangePicker;
};
const field = () => screen.getByRole("combobox", { name: "Stay" }) as HTMLInputElement;
/** The field's text with Intl's thin spaces read as plain ones. */
const shown = () => field().value.replace(/\s/g, " ");
const day = (iso: string) => document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;
const changes = (host: HTMLElement) => {
  const seen: unknown[] = [];
  host.addEventListener("change", (event) => seen.push((event as CustomEvent).detail));
  return seen;
};
/** The restore runs one task after the reset event; wait past it. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("<ds-date-range-picker>", () => {
  it("shows a placeholder when empty and the formatted range when set", () => {
    mount();
    expect(field()).toHaveValue("");
    expect(field()).toHaveAttribute("placeholder", "Select a range");
    expect(field()).toHaveClass("date-picker__input--range");
    mount('start="2026-06-10" end="2026-06-14"');
    expect(shown()).toBe("Jun 10 – 14, 2026");
  });

  it("shows a half-open range while only the start is set", () => {
    mount('start="2026-06-10"');
    expect(field()).toHaveValue("Jun 10, 2026 – …");
  });

  it("opens two months in a wide popup, with focus on the start", async () => {
    const user = userEvent.setup();
    mount('start="2026-06-10" end="2026-06-14"');
    await user.click(field());
    expect(screen.getAllByRole("grid")).toHaveLength(2);
    expect(document.querySelector(".date-picker__popover--wide")).not.toBeNull();
    expect(day("2026-06-10")).toHaveFocus();
    expect(day("2026-06-12")).toHaveAttribute("data-in-range", "");
  });

  it("completes a range across two picks, then closes and returns focus", async () => {
    const user = userEvent.setup();
    const host = mount('start="2026-06-10" end="2026-06-14"');
    const seen = changes(host);
    await user.click(field());
    await user.click(day("2026-06-18"));
    expect(screen.getAllByRole("grid")).toHaveLength(2);
    await user.click(day("2026-06-22"));
    expect(seen).toEqual([
      { start: "2026-06-18", end: null },
      { start: "2026-06-18", end: "2026-06-22" },
    ]);
    expect(host.start).toBe("2026-06-18");
    expect(host.end).toBe("2026-06-22");
    expect(shown()).toBe("Jun 18 – 22, 2026");
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    expect(field()).toHaveFocus();
  });

  it("makes the range with the keyboard alone", () => {
    // A pick on a finished range starts a new one.
    const host = mount('start="2026-06-10" end="2026-06-12"');
    const seen = changes(host);
    field().focus();
    fireEvent.keyDown(field(), { key: "ArrowDown" });
    fireEvent.keyDown(day("2026-06-10"), { key: "Enter" });
    fireEvent.keyDown(day("2026-06-10"), { key: "ArrowDown" });
    fireEvent.keyDown(day("2026-06-17"), { key: "Enter" });
    expect(seen.at(-1)).toEqual({ start: "2026-06-10", end: "2026-06-17" });
    expect(field()).toHaveFocus();
  });

  it("clears the range with the clear button", async () => {
    const user = userEvent.setup();
    const host = mount('start="2026-06-10" end="2026-06-14" clearable');
    const seen = changes(host);
    await user.click(screen.getByRole("button", { name: "Clear range" }));
    expect(seen).toEqual([{ start: null, end: null }]);
    expect(field()).toHaveValue("");
    expect(host).not.toHaveAttribute("start");
  });

  it("uses the view attribute for the popup's calendar", async () => {
    const user = userEvent.setup();
    mount('start="2026-06-10" view="month"');
    await user.click(field());
    expect(screen.getAllByRole("grid")).toHaveLength(1);
  });

  it("formats the range in the locale around it", () => {
    mount('start="2026-06-10" end="2026-06-14" date-style="long"', "it");
    expect(screen.getByRole("combobox", { name: "Stay" })).toHaveValue("10–14 giugno 2026");
  });

  it("has no accessibility violations when open on two months", async () => {
    const user = userEvent.setup();
    mount('start="2026-06-10" end="2026-06-14"');
    await user.click(field());
    expect(await axe(document.body)).toHaveNoViolations();
  }, 30_000);
});

describe("<ds-date-range-picker> in a form", () => {
  const mountForm = (attrs = 'start="2026-06-10" end="2026-06-14"') => {
    document.body.innerHTML = `<form lang="en-US">
      <ds-date-range-picker label="Stay" start-name="from" end-name="to" ${attrs}></ds-date-range-picker>
    </form>`;
    return {
      form: document.querySelector("form")!,
      host: document.querySelector("ds-date-range-picker") as DsDateRangePicker,
    };
  };

  it("submits both ISO dates under their names, and nothing while disabled", () => {
    const { form } = mountForm();
    expect(new FormData(form).get("from")).toBe("2026-06-10");
    expect(new FormData(form).get("to")).toBe("2026-06-14");
    const disabled = mountForm('start="2026-06-10" end="2026-06-14" disabled');
    expect([...new FormData(disabled.form).keys()]).toEqual([]);
  });

  it("puts the last range set from outside back on reset, quietly", async () => {
    const user = userEvent.setup();
    const { form, host } = mountForm();
    const seen = changes(host);
    await user.click(field());
    await user.click(day("2026-06-20"));
    await user.click(day("2026-06-24"));
    expect(seen).toHaveLength(2);
    form.reset();
    await settled();
    expect(host.start).toBe("2026-06-10");
    expect(host.end).toBe("2026-06-14");
    expect(new FormData(form).get("to")).toBe("2026-06-14");
    expect(shown()).toBe("Jun 10 – 14, 2026");
    expect(seen).toHaveLength(2);
  });
});
