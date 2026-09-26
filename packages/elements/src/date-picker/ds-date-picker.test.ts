import { fireEvent, screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsDatePicker } from "./ds-date-picker";

const mount = (attrs = 'value="2026-06-15"', lang = "en-US") => {
  document.body.innerHTML = `<main lang="${lang}">
    <ds-date-picker label="Event date" ${attrs}></ds-date-picker>
    <button type="button">after</button>
  </main>`;
  return document.querySelector("ds-date-picker") as DsDatePicker;
};
const field = () => screen.getByRole("combobox", { name: "Event date" }) as HTMLInputElement;
const day = (iso: string) => document.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;
const changes = (host: HTMLElement) => {
  const seen: unknown[] = [];
  host.addEventListener("change", (event) => seen.push((event as CustomEvent).detail));
  return seen;
};

describe("<ds-date-picker>", () => {
  it("renders a readonly combobox with the label and placeholder, closed", () => {
    mount("");
    expect(field()).toHaveAttribute("readonly");
    expect(field()).toHaveAttribute("placeholder", "Select a date");
    expect(field()).toHaveAttribute("aria-haspopup", "dialog");
    expect(field()).toHaveAttribute("aria-expanded", "false");
    expect(field()).toHaveValue("");
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("shows a preselected value formatted for the locale", () => {
    mount();
    expect(field()).toHaveValue("Jun 15, 2026");
    mount('value="2026-06-15" date-style="long"', "it");
    expect(screen.getByRole("combobox", { name: "Event date" })).toHaveValue("15 giugno 2026");
  });

  it("opens the calendar in a named dialog, with focus on the selected day", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(field());
    const dialog = screen.getByRole("dialog", { name: "Event date" });
    expect(field()).toHaveAttribute("aria-expanded", "true");
    expect(field()).toHaveAttribute("aria-controls", dialog.id);
    expect(day("2026-06-15")).toHaveFocus();
  });

  it("opens from the keyboard with Enter, Space and ArrowDown", () => {
    mount();
    for (const key of ["Enter", " ", "ArrowDown"]) {
      field().focus();
      fireEvent.keyDown(field(), { key });
      expect(screen.getByRole("grid")).toBeInTheDocument();
      fireEvent.keyDown(day("2026-06-15"), { key: "Escape" });
      expect(screen.queryByRole("grid")).not.toBeInTheDocument();
      expect(field()).toHaveFocus();
    }
  });

  it("picks a day with the keyboard, fills the field, closes and returns focus", () => {
    const host = mount();
    const seen = changes(host);
    field().focus();
    fireEvent.keyDown(field(), { key: "Enter" });
    fireEvent.keyDown(day("2026-06-15"), { key: "ArrowRight" });
    fireEvent.keyDown(day("2026-06-16"), { key: "Enter" });
    expect(seen).toEqual([{ value: "2026-06-16" }]);
    expect(field()).toHaveValue("Jun 16, 2026");
    expect(host.value).toBe("2026-06-16");
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    expect(field()).toHaveFocus();
  });

  it("picks a day on click and reports only its own change", async () => {
    const user = userEvent.setup();
    const host = mount();
    const seen = changes(host);
    const focus = vi.fn();
    host.addEventListener("focus-change", focus);
    await user.click(field());
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(day("2026-07-20"));
    expect(seen).toEqual([{ value: "2026-07-20" }]);
    expect(focus).not.toHaveBeenCalled();
    expect(field()).toHaveValue("Jul 20, 2026");
  });

  it("closes on a press outside without moving focus back", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(field());
    await user.click(screen.getByRole("button", { name: "after" }));
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
  });

  it("clears the value with the clear button and keeps focus in the control", async () => {
    const user = userEvent.setup();
    const host = mount('value="2026-06-15" clearable');
    const seen = changes(host);
    await user.click(screen.getByRole("button", { name: "Clear date" }));
    expect(seen).toEqual([{ value: null }]);
    expect(field()).toHaveValue("");
    expect(host).not.toHaveAttribute("value");
    expect(field()).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Clear date" })).not.toBeInTheDocument();
  });

  it("forwards min and max so out-of-range days are disabled", async () => {
    const user = userEvent.setup();
    mount('value="2026-06-15" min="2026-06-10" max="2026-06-20"');
    await user.click(field());
    expect(day("2026-06-05")).toHaveAttribute("data-disabled", "");
  });

  it("stays closed while disabled", async () => {
    const user = userEvent.setup();
    mount('value="2026-06-15" disabled');
    await user.click(field());
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("settles on the date a page writes back from the listener", async () => {
    const user = userEvent.setup();
    const host = mount();
    host.addEventListener("change", () => host.setAttribute("value", "2026-06-02"));
    await user.click(field());
    await user.click(day("2026-06-20"));
    expect(field()).toHaveValue("Jun 2, 2026");
  });

  it("takes its labels from the provider's catalog, a label attribute still wins", () => {
    document.body.innerHTML = `<ds-locale-provider locale="it">
      <ds-date-picker clearable value="2026-06-15"></ds-date-picker>
    </ds-locale-provider>`;
    const provider = document.querySelector("ds-locale-provider") as HTMLElement & {
      messages: Record<string, string>;
    };
    provider.messages = { "datePicker.label": "Data", "datePicker.clear": "Cancella data" };
    expect(screen.getByRole("combobox", { name: "Data" })).toHaveValue("15 giu 2026");
    expect(screen.getByRole("button", { name: "Cancella data" })).toBeInTheDocument();
  });

  it("has no accessibility violations, closed and open", async () => {
    const user = userEvent.setup();
    mount('value="2026-06-15" clearable');
    expect(await axe(document.body)).toHaveNoViolations();
    await user.click(field());
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe("<ds-date-picker> in a form", () => {
  const mountForm = (attrs = 'value="2026-06-15"') => {
    document.body.innerHTML = `<form lang="en-US">
      <ds-date-picker label="Due date" name="due" ${attrs}></ds-date-picker>
    </form>`;
    return {
      form: document.querySelector("form")!,
      host: document.querySelector("ds-date-picker") as DsDatePicker,
    };
  };

  it("submits the ISO date under its name", async () => {
    const user = userEvent.setup();
    const { form } = mountForm();
    expect(new FormData(form).get("due")).toBe("2026-06-15");
    await user.click(screen.getByRole("combobox", { name: "Due date" }));
    await user.click(day("2026-06-20"));
    expect(new FormData(form).get("due")).toBe("2026-06-20");
  });

  it("sends nothing while disabled", () => {
    const { form } = mountForm('value="2026-06-15" disabled');
    expect([...new FormData(form).keys()]).toEqual([]);
  });

  it("puts the last value set from outside back on reset, quietly", async () => {
    const user = userEvent.setup();
    const { form, host } = mountForm();
    const seen = changes(host);
    await user.click(screen.getByRole("combobox", { name: "Due date" }));
    await user.click(day("2026-06-20"));
    expect(seen).toHaveLength(1);
    form.reset();
    await settled();
    expect(host.value).toBe("2026-06-15");
    expect(screen.getByRole("combobox", { name: "Due date" })).toHaveValue("Jun 15, 2026");
    expect(new FormData(form).get("due")).toBe("2026-06-15");
    expect(seen).toHaveLength(1);
  });

  it("treats a page's own value as the new default, and an echo as none", async () => {
    const user = userEvent.setup();
    const { form, host } = mountForm();
    host.addEventListener("change", (event) =>
      host.setAttribute("value", (event as CustomEvent).detail.value),
    );
    await user.click(screen.getByRole("combobox", { name: "Due date" }));
    await user.click(day("2026-06-20"));
    form.reset();
    await settled();
    expect(host.value).toBe("2026-06-15");

    host.value = "2026-06-01";
    form.reset();
    await settled();
    expect(host.value).toBe("2026-06-01");
  });
});

/** The restore runs one task after the reset event; wait past it. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));
