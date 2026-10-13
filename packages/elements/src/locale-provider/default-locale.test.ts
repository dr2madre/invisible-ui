import { afterEach, describe, expect, it } from "vitest";
import "../define";

// June 2026 starts on a Monday, so the first cell of the grid names the
// week's first day.
const SUNDAY = "2026-05-31";
const MONDAY = "2026-06-01";

const FIELDS = `
  <ds-calendar value="2026-06-15" focused-date="2026-06-15"></ds-calendar>
  <ds-time-field value="21:30" label="Time"></ds-time-field>`;

const firstCell = () => document.querySelector("[data-date]")?.getAttribute("data-date");
const hasDayPeriod = () => document.querySelector('[data-segment="dayPeriod"]') !== null;

afterEach(() => {
  document.body.innerHTML = "";
  document.documentElement.removeAttribute("lang");
});

describe("default locale of the elements", () => {
  it("uses Monday and 24-hour time without a provider or a page language", () => {
    document.body.innerHTML = FIELDS;
    expect(firstCell()).toBe(MONDAY);
    expect(hasDayPeriod()).toBe(false);
  });

  it("follows the page's lang without a provider", () => {
    document.documentElement.lang = "en-US";
    document.body.innerHTML = FIELDS;
    expect(firstCell()).toBe(SUNDAY);
    expect(hasDayPeriod()).toBe(true);
  });

  it("follows the closest lang around the element", () => {
    document.documentElement.lang = "it-IT";
    document.body.innerHTML = `<section lang="en-US">${FIELDS}</section>`;
    expect(firstCell()).toBe(SUNDAY);
    expect(hasDayPeriod()).toBe(true);
  });

  it("lets the provider's locale win over the page's", () => {
    document.documentElement.lang = "en-US";
    document.body.innerHTML = `<ds-locale-provider locale="it-IT">${FIELDS}</ds-locale-provider>`;
    expect(firstCell()).toBe(MONDAY);
    expect(hasDayPeriod()).toBe(false);
  });
});
