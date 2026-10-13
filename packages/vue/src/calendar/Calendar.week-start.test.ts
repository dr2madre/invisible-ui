import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { renderToString } from "@vue/server-renderer";
import { createSSRApp, defineComponent, h, nextTick, shallowRef, type Component } from "vue";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../i18n/i18n";
import { DatePicker } from "../date-picker/DatePicker";
import { DateRangePicker } from "../date-range-picker/DateRangePicker";
import { Calendar } from "./Calendar";

// June 2026 starts on a Monday, so the first cell of the grid names the
// week's first day: Sunday 31 May, Monday 1 June or Saturday 30 May.
const SUNDAY = "2026-05-31";
const MONDAY = "2026-06-01";
const SATURDAY = "2026-05-30";

const calendarProps = { value: "2026-06-15", focusedDate: "2026-06-15" };

const inLocale = (locale: string | undefined, child: Component, props: Record<string, unknown>) =>
  defineComponent({
    setup: () => () =>
      locale === undefined ? h(child, props) : h(LocaleProvider, { locale }, () => h(child, props)),
  });

const firstCell = () => document.querySelector("[data-date]")?.getAttribute("data-date");

describe("Vue Calendar week start", () => {
  it.each([
    [undefined, SUNDAY],
    ["en-US", SUNDAY],
    ["it-IT", MONDAY],
    ["ar-EG", SATURDAY],
  ])("starts the week from the provider's locale %s", (locale, first) => {
    render(inLocale(locale, Calendar, calendarProps));
    expect(firstCell()).toBe(first);
  });

  it("follows the calendar's own locale over the provider's", () => {
    render(inLocale("en-US", Calendar, { ...calendarProps, locale: "it-IT" }));
    expect(firstCell()).toBe(MONDAY);
  });

  it("lets an explicit weekStartsOn win", () => {
    render(inLocale("en-US", Calendar, { ...calendarProps, weekStartsOn: 1 }));
    expect(firstCell()).toBe(MONDAY);
  });

  it("follows a locale change", async () => {
    const locale = shallowRef("en-US");
    render(
      defineComponent({
        setup: () => () =>
          h(LocaleProvider, { locale: locale.value }, () => h(Calendar, calendarProps)),
      }),
    );
    expect(firstCell()).toBe(SUNDAY);
    locale.value = "it-IT";
    await nextTick();
    expect(firstCell()).toBe(MONDAY);
  });

  it("renders the same first day on the server and the client", async () => {
    const Fixture = inLocale("it-IT", Calendar, calendarProps);
    const html = await renderToString(createSSRApp(Fixture));
    expect(/data-date="([^"]+)"/.exec(html)?.[1]).toBe(MONDAY);
    render(Fixture);
    expect(firstCell()).toBe(MONDAY);
  });

  it.each([
    ["DatePicker", DatePicker, { label: "Date", value: "2026-06-15" }],
    ["DateRangePicker", DateRangePicker, { label: "Dates", start: "2026-06-15" }],
  ] as const)("%s opens on the provider's first day of the week", async (_name, picker, props) => {
    const user = userEvent.setup();
    render(inLocale("ar-EG", picker, props));
    await user.click(screen.getByRole("combobox"));
    // A two-month view leaves the outside days blank: June 1 sits third in a
    // week that starts on Saturday.
    const june1 = document.querySelector(`[data-date="${MONDAY}"]`)!.closest(".calendar__cell")!;
    expect([...june1.parentElement!.children].indexOf(june1)).toBe(2);
  });
});
