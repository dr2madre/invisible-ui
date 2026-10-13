import { render } from "@testing-library/vue";
import { renderToString } from "@vue/server-renderer";
import { createSSRApp, defineComponent, h, nextTick, type Component } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Calendar } from "../calendar/Calendar";
import { TimeField } from "../time-field/TimeField";
import { LocaleProvider, useI18n } from "./i18n";

// June 2026 starts on a Monday, so the first cell of the grid names the
// week's first day.
const SUNDAY = "2026-05-31";
const MONDAY = "2026-06-01";

const Probe = defineComponent({
  setup() {
    const i18n = useI18n();
    return () => h("output", { "data-dir": i18n.value.dir }, i18n.value.locale);
  },
});

const Page = defineComponent({
  props: { locale: { type: String, default: undefined } },
  setup(props) {
    const children = () => [
      h(Probe),
      h(Calendar, { value: "2026-06-15", focusedDate: "2026-06-15" }),
      h(TimeField, { value: "21:30", label: "Time" }),
    ];
    return () =>
      props.locale ? h(LocaleProvider, { locale: props.locale }, children) : h("div", children());
  },
});

const firstCell = () => document.querySelector("[data-date]")?.getAttribute("data-date");
const hasDayPeriod = () => document.querySelector(".time-field__segment--period") !== null;
const probe = () => document.querySelector("output")!;

function setPage(lang?: string, dir?: string) {
  const root = document.documentElement;
  if (lang === undefined) root.removeAttribute("lang");
  else root.setAttribute("lang", lang);
  if (dir === undefined) root.removeAttribute("dir");
  else root.setAttribute("dir", dir);
}

afterEach(() => {
  setPage();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("Vue default locale", () => {
  it("uses Monday and 24-hour time without a provider or a page language", async () => {
    render(Page);
    await nextTick();
    expect(probe()).toHaveTextContent("en-001-u-hc-h23");
    expect(probe()).toHaveAttribute("data-dir", "ltr");
    expect(firstCell()).toBe(MONDAY);
    expect(hasDayPeriod()).toBe(false);
  });

  it("follows the page's lang and dir without a provider", async () => {
    setPage("en-US", "rtl");
    render(Page);
    await nextTick();
    expect(probe()).toHaveTextContent("en-US");
    expect(probe()).toHaveAttribute("data-dir", "rtl");
    expect(firstCell()).toBe(SUNDAY);
    expect(hasDayPeriod()).toBe(true);
  });

  it("follows a change of the page's lang", async () => {
    setPage("en-US");
    render(Page);
    await nextTick();
    expect(firstCell()).toBe(SUNDAY);
    setPage("it-IT");
    await new Promise((resolve) => setTimeout(resolve));
    await nextTick();
    expect(firstCell()).toBe(MONDAY);
  });

  it("lets the provider's locale win over the page's", async () => {
    setPage("en-US");
    render(Page, { props: { locale: "it-IT" } });
    await nextTick();
    expect(probe()).toHaveTextContent("it-IT");
    expect(firstCell()).toBe(MONDAY);
    expect(hasDayPeriod()).toBe(false);
  });

  it("gives a provider without a locale the page's", async () => {
    setPage("en-US");
    render(defineComponent({ setup: () => () => h(LocaleProvider, null, () => h(Probe)) }));
    await nextTick();
    expect(probe()).toHaveTextContent("en-US");
    expect(document.querySelector("div[lang]")).toHaveAttribute("lang", "en-US");
  });

  it("server-renders the default and hydrates without a mismatch, then reads the page", async () => {
    setPage("en-US");
    const html = await renderToString(createSSRApp(Page as Component));
    expect(/data-date="([^"]+)"/.exec(html)?.[1]).toBe(MONDAY);
    document.body.innerHTML = `<div id="app">${html}</div>`;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const app = createSSRApp(Page as Component);
    app.mount("#app");
    await nextTick();
    const messages = [...warn.mock.calls, ...error.mock.calls]
      .flat()
      .map(String)
      .filter((message) => /hydration|mismatch/i.test(message));
    expect(messages).toEqual([]);
    expect(firstCell()).toBe(SUNDAY);
    expect(hasDayPeriod()).toBe(true);
    app.unmount();
  });
});
