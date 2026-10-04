import "../define";

// Weekday and month names must not depend on the time zone. A date at UTC
// midnight is the previous day west of UTC, so a name formatted from it
// shifts by one there. Each zone pairs with its own locale: the shared
// formatter cache keeps the zone a formatter was created in.
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const zones = [
  { zone: "America/Los_Angeles", locale: "en-US" },
  { zone: "Pacific/Auckland", locale: "en-NZ" },
];

const texts = (selector: string) =>
  [...document.querySelectorAll(selector)].map((node) => node.textContent?.trim());

describe.each(zones)("<ds-calendar> names in $zone", ({ zone, locale }) => {
  const original = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = zone;
  });
  afterAll(() => {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  });

  const mount = (view: string) => {
    document.body.innerHTML = `<ds-calendar value="2026-06-15" focused-date="2026-06-15" week-starts-on="0" view="${view}" locale="${locale}"></ds-calendar>`;
  };

  it("labels the weekday headers with the right day", () => {
    mount("month");
    const headers = [...document.querySelectorAll(".calendar__weekdays [role='columnheader']")];
    expect(headers.map((cell) => cell.getAttribute("aria-label"))).toEqual(WEEKDAYS);
    expect(headers.map((cell) => cell.textContent)).toEqual(WEEKDAYS.map((d) => d.slice(0, 3)));
  });

  it("names a day by its own weekday", () => {
    mount("month");
    const day = document.querySelector('[data-date="2026-06-15"]');
    expect(day?.getAttribute("aria-label")).toMatch(/^Monday, /);
  });

  it("titles each month of the two-month view", () => {
    mount("two-month");
    expect(texts(".calendar__month-title")).toEqual(["June 2026", "July 2026"]);
  });

  it("names every month of the year view", () => {
    mount("year");
    expect(texts(".calendar__mini-title")).toEqual(MONTHS);
  });
});
