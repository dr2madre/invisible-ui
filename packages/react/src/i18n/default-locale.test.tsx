import { act, render } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Calendar } from "../calendar/Calendar";
import { TimeField } from "../time-field/TimeField";
import { LocaleProvider, useI18n } from "./i18n";

// June 2026 starts on a Monday, so the first cell of the grid names the
// week's first day.
const SUNDAY = "2026-05-31";
const MONDAY = "2026-06-01";

function Probe() {
  const { locale, dir } = useI18n();
  return <output data-dir={dir}>{locale}</output>;
}

function Page({ locale }: { locale?: string }) {
  const children = (
    <>
      <Probe />
      <Calendar value="2026-06-15" focusedDate="2026-06-15" />
      <TimeField value="21:30" label="Time" />
    </>
  );
  return locale ? <LocaleProvider locale={locale}>{children}</LocaleProvider> : children;
}

const firstCell = () => document.querySelector("[data-date]")?.getAttribute("data-date");
const hasDayPeriod = () => document.querySelector('[data-segment="dayPeriod"]') !== null;
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

describe("React default locale", () => {
  it("uses Monday and 24-hour time without a provider or a page language", () => {
    render(<Page />);
    expect(probe()).toHaveTextContent("en-001-u-hc-h23");
    expect(probe()).toHaveAttribute("data-dir", "ltr");
    expect(firstCell()).toBe(MONDAY);
    expect(hasDayPeriod()).toBe(false);
  });

  it("follows the page's lang and dir without a provider", () => {
    setPage("en-US", "rtl");
    render(<Page />);
    expect(probe()).toHaveTextContent("en-US");
    expect(probe()).toHaveAttribute("data-dir", "rtl");
    expect(firstCell()).toBe(SUNDAY);
    expect(hasDayPeriod()).toBe(true);
  });

  it("follows a change of the page's lang", async () => {
    setPage("en-US");
    render(<Page />);
    expect(firstCell()).toBe(SUNDAY);
    await act(async () => {
      setPage("it-IT");
      await new Promise((resolve) => setTimeout(resolve));
    });
    expect(firstCell()).toBe(MONDAY);
  });

  it("lets the provider's locale win over the page's", () => {
    setPage("en-US");
    render(<Page locale="it-IT" />);
    expect(probe()).toHaveTextContent("it-IT");
    expect(firstCell()).toBe(MONDAY);
    expect(hasDayPeriod()).toBe(false);
  });

  it("gives a provider without a locale the page's", () => {
    setPage("en-US");
    render(
      <LocaleProvider>
        <Probe />
      </LocaleProvider>,
    );
    expect(probe()).toHaveTextContent("en-US");
    expect(document.querySelector("div[lang]")).toHaveAttribute("lang", "en-US");
  });

  it("server-renders the default and hydrates without a mismatch, then reads the page", async () => {
    setPage("en-US");
    const html = renderToString(<Page />);
    expect(/data-date="([^"]+)"/.exec(html)?.[1]).toBe(MONDAY);
    document.body.innerHTML = `<div id="app">${html}</div>`;
    const host = document.querySelector<HTMLElement>("#app")!;
    const recoverableError = vi.fn();
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    let root: Root | undefined;
    await act(async () => {
      root = hydrateRoot(host, <Page />, { onRecoverableError: recoverableError });
    });
    expect(recoverableError).not.toHaveBeenCalled();
    expect(
      error.mock.calls
        .flat()
        .map(String)
        .filter((message) => /hydration|did not match|server rendered/i.test(message)),
    ).toEqual([]);
    expect(firstCell()).toBe(SUNDAY);
    expect(hasDayPeriod()).toBe(true);
    await act(async () => root?.unmount());
  });
});
