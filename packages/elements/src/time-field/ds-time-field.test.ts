import { fireEvent, screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsTimeField } from "./ds-time-field";

const mount = (attrs = 'value="09:30"', lang = "it") => {
  document.body.innerHTML = `<main lang="${lang}">
    <ds-time-field label="Start time" ${attrs}></ds-time-field>
    <button type="button">after</button>
  </main>`;
  return document.querySelector("ds-time-field") as DsTimeField;
};
const seg = (name: string) =>
  screen.getByRole("spinbutton", { name: new RegExp(`^${name}$`, "i") });
const record = (host: HTMLElement, type = "change") => {
  const seen: unknown[] = [];
  host.addEventListener(type, (event) => seen.push((event as CustomEvent).detail));
  return seen;
};
/** The restore runs one task after the reset event; wait past it. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("<ds-time-field>", () => {
  it("renders hour and minute spinbuttons in a named group", () => {
    mount();
    expect(screen.getByRole("group", { name: "Start time" })).toBeInTheDocument();
    expect(screen.getAllByRole("spinbutton")).toHaveLength(2);
    expect(seg("hour")).toHaveTextContent("09");
    expect(seg("minute")).toHaveTextContent("30");
    expect(seg("hour")).toHaveAttribute("aria-valuenow", "9");
  });

  it("shows placeholders while empty", () => {
    mount("");
    expect(seg("hour")).toHaveTextContent("hh");
    expect(seg("hour")).toHaveClass("time-field__segment--placeholder");
    expect(seg("hour")).toHaveAttribute("aria-valuetext", "Empty");
  });

  it("adds a seconds segment when configured", () => {
    mount('value="09:30:15" with-seconds');
    expect(seg("second")).toHaveTextContent("15");
    expect(screen.getAllByRole("spinbutton")).toHaveLength(3);
  });

  it("follows the locale's hour cycle, and hour-cycle overrides it", () => {
    mount('value="21:30"', "en-US");
    expect(seg("hour")).toHaveTextContent("09");
    expect(seg("AM/PM")).toHaveTextContent("PM");
    mount('value="21:30"', "it");
    expect(seg("hour")).toHaveTextContent("21");
    expect(screen.queryByRole("spinbutton", { name: "AM/PM" })).not.toBeInTheDocument();
    mount('value="21:30" hour-cycle="12"', "it");
    expect(seg("AM/PM")).toHaveTextContent("PM");
  });

  it("normalizes a flexible value to the canonical form", () => {
    const host = mount('value="9:30"');
    expect(seg("hour")).toHaveTextContent("09");
    expect(host.value).toBe("09:30");
  });

  it("does not infer AM while a 12-hour value is incomplete", () => {
    const host = mount('hour-cycle="12"');
    const seen = record(host);
    expect(seg("AM/PM")).toHaveTextContent("--");
    fireEvent.keyDown(seg("hour"), { key: "9" });
    fireEvent.keyDown(seg("minute"), { key: "3" });
    fireEvent.keyDown(seg("minute"), { key: "0" });
    expect(seen).not.toContainEqual({ value: "09:30" });
    fireEvent.keyDown(seg("AM/PM"), { key: "p" });
    expect(seen.at(-1)).toEqual({ value: "21:30" });
  });

  it("flags an invalid value without partially accepting it", () => {
    mount('value="25:30"');
    const group = screen.getByRole("group", { name: "Start time" });
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(group).toHaveAccessibleDescription("Enter a time within the allowed range.");
    expect(seg("hour")).toHaveTextContent("hh");
    expect(seg("hour")).toHaveAttribute("aria-invalid", "true");
  });

  it("steps with ArrowUp, wraps on overflow, and reports each value", () => {
    const host = mount('value="09:59"');
    const seen = record(host);
    fireEvent.keyDown(seg("minute"), { key: "ArrowUp" });
    expect(seg("minute")).toHaveTextContent("00");
    fireEvent.keyDown(seg("minute"), { key: "ArrowUp" });
    expect(seen).toEqual([{ value: "09:00" }, { value: "09:01" }]);
    expect(host).toHaveAttribute("value", "09:01");
  });

  it("types digits, moves to the next segment when one is full", () => {
    const host = mount('value="00:00"');
    const seen = record(host);
    seg("hour").focus();
    fireEvent.keyDown(seg("hour"), { key: "1" });
    fireEvent.keyDown(seg("hour"), { key: "4" });
    expect(seg("hour")).toHaveTextContent("14");
    expect(seg("minute")).toHaveFocus();
    expect(seen.at(-1)).toEqual({ value: "14:00" });
  });

  it("does not reinterpret an impossible second digit", () => {
    mount('value="00:00"');
    seg("hour").focus();
    fireEvent.keyDown(seg("hour"), { key: "2" });
    fireEvent.keyDown(seg("hour"), { key: "5" });
    expect(seg("hour")).toHaveTextContent("02");
    expect(seg("hour")).toHaveFocus();
  });

  it("moves between segments with ArrowLeft and ArrowRight", () => {
    mount();
    seg("hour").focus();
    fireEvent.keyDown(seg("hour"), { key: "ArrowRight" });
    expect(seg("minute")).toHaveFocus();
    fireEvent.keyDown(seg("minute"), { key: "ArrowLeft" });
    expect(seg("hour")).toHaveFocus();
  });

  it("clears a segment with Backspace and reports null", () => {
    const host = mount();
    const seen = record(host);
    fireEvent.keyDown(seg("minute"), { key: "Backspace" });
    expect(seg("minute")).toHaveTextContent("mm");
    expect(seen).toEqual([{ value: null }]);
    expect(host).not.toHaveAttribute("value");
  });

  it("reports the finished value once when focus leaves the field", () => {
    const host = mount();
    const commits = record(host, "commit");
    fireEvent.keyDown(seg("minute"), { key: "ArrowUp" });
    fireEvent.focusOut(seg("minute"), { relatedTarget: seg("hour") });
    expect(commits).toEqual([]);
    const after = screen.getByRole("button", { name: "after" });
    fireEvent.focusOut(seg("minute"), { relatedTarget: after });
    fireEvent.focusOut(seg("minute"), { relatedTarget: after });
    expect(commits).toEqual([{ value: "09:31" }]);
  });

  it("puts the segments back on Escape, and lets Escape through with nothing to undo", () => {
    mount();
    fireEvent.keyDown(seg("minute"), { key: "ArrowUp" });
    fireEvent.keyDown(seg("minute"), { key: "Escape" });
    expect(seg("minute")).toHaveTextContent("30");
    expect(fireEvent.keyDown(seg("minute"), { key: "Escape" })).toBe(true);
  });

  it("reports a time outside min without correcting it", () => {
    const host = mount('value="09:30" min="09:00"');
    const errors = record(host, "validation-change");
    expect(screen.queryByText(/no earlier than/)).not.toBeInTheDocument();
    fireEvent.keyDown(seg("hour"), { key: "ArrowDown" });
    expect(seg("hour")).toHaveTextContent("08");
    expect(screen.getByText("Enter a time no earlier than 09:00.")).toBeVisible();
    expect(host.validationError).toBe("range-underflow");
    // A range error is not the value's own: the event stays for structure.
    expect(errors).toEqual([]);
  });

  it("shows an error text from the page and marks the field invalid", () => {
    mount('value="09:30" error="Pick a slot during opening hours."');
    const group = screen.getByRole("group", { name: "Start time" });
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(group).toHaveAccessibleDescription("Pick a slot during opening hours.");
  });

  it("does not edit a disabled field", () => {
    const host = mount('value="09:30" disabled');
    const seen = record(host);
    fireEvent.keyDown(seg("minute"), { key: "ArrowUp" });
    expect(seg("minute")).toHaveTextContent("30");
    expect(seg("minute")).toHaveAttribute("tabindex", "-1");
    expect(seen).toEqual([]);
  });

  it("takes segment labels from the provider's catalog", () => {
    document.body.innerHTML = `<ds-locale-provider locale="it">
      <ds-time-field value="09:30"></ds-time-field>
    </ds-locale-provider>`;
    const provider = document.querySelector("ds-locale-provider") as HTMLElement & {
      messages: Record<string, string>;
    };
    provider.messages = { "timeField.label": "Orario", "timeField.hour": "Ora" };
    expect(screen.getByRole("group", { name: "Orario" })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "Ora" })).toHaveTextContent("09");
  });

  it("has no accessibility violations", async () => {
    mount('value="09:30" hour-cycle="12"');
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe("<ds-time-field> in a form", () => {
  const mountForm = (attrs = 'value="09:30"') => {
    document.body.innerHTML = `<form lang="it">
      <ds-time-field label="Start" name="time" ${attrs}></ds-time-field>
    </form>`;
    return {
      form: document.querySelector("form")!,
      host: document.querySelector("ds-time-field") as DsTimeField,
    };
  };

  it("submits the formatted time under its name", () => {
    const { form } = mountForm();
    expect(new FormData(form).get("time")).toBe("09:30");
    fireEvent.keyDown(seg("minute"), { key: "ArrowUp" });
    expect(new FormData(form).get("time")).toBe("09:31");
  });

  it("sends nothing while disabled, and nothing without a name", () => {
    expect([...new FormData(mountForm('value="09:30" disabled').form).keys()]).toEqual([]);
    document.body.innerHTML = `<form><ds-time-field value="09:30"></ds-time-field></form>`;
    expect([...new FormData(document.querySelector("form")!).keys()]).toEqual([]);
  });

  it("puts the last value set from outside back on reset, quietly, and Escape keeps it", async () => {
    const { form, host } = mountForm();
    const seen = record(host);
    fireEvent.keyDown(seg("minute"), { key: "ArrowUp" });
    fireEvent.focusOut(seg("minute"), { relatedTarget: null });
    expect(seen).toHaveLength(1);
    form.reset();
    await settled();
    expect(host.value).toBe("09:30");
    expect(seg("minute")).toHaveTextContent("30");
    expect(new FormData(form).get("time")).toBe("09:30");
    fireEvent.keyDown(seg("minute"), { key: "Escape" });
    expect(seg("minute")).toHaveTextContent("30");
    expect(seen).toHaveLength(1);
  });

  it("adopts a page's own value as the default, never an echo", async () => {
    const user = userEvent.setup();
    const { form, host } = mountForm();
    host.addEventListener("change", (event) =>
      host.setAttribute("value", (event as CustomEvent).detail.value ?? ""),
    );
    await user.click(seg("minute"));
    fireEvent.keyDown(seg("minute"), { key: "ArrowUp" });
    form.reset();
    await settled();
    expect(host.value).toBe("09:30");
    host.value = "18:00";
    form.reset();
    await settled();
    expect(host.value).toBe("18:00");
  });
});
