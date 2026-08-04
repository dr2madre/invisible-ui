// @vitest-environment node
import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import Calendar from "./calendar/Calendar.svelte";
import Combobox from "./combobox/Combobox.svelte";
import Meter from "./meter/Meter.svelte";
import PinInput from "./pin-input/PinInput.svelte";
import Progress from "./progress/Progress.svelte";
import TextField from "./text-field/TextField.svelte";

// SSR guarantee: every component (via its fixture, which supplies valid props)
// must server-render to an HTML string without touching the DOM. Overlays and
// portal-based components are the risk points — in their default (closed) state
// they should emit just their trigger, never reach for `document`/`window`.
const fixtures = import.meta.glob("./**/*.fixture.svelte", { eager: true });

describe("SSR — fixtures render to HTML without throwing", () => {
  const entries = Object.entries(fixtures);

  it("found fixtures to test", () => {
    expect(entries.length).toBeGreaterThan(30);
  });

  for (const [path, mod] of entries) {
    it(path.replace("./", ""), () => {
      const Component = (mod as { default: unknown }).default as Parameters<typeof render>[0];
      const { body } = render(Component);
      expect(typeof body).toBe("string");
    });
  }
});

// The roles and names the actions apply have to be in the markup too, or the
// server-rendered page carries an invalid structure until hydration: rows with
// no grid, a label on an element with no role, inputs with no name. Each case
// renders the styled component and reads what its markup declares on its own.
describe("SSR — the markup is valid before hydration", () => {
  const cases: Array<[string, unknown, Record<string, unknown>, RegExp[]]> = [
    ["Calendar", Calendar, { label: "Calendar" }, [/role="grid"/, /role="row"/, /role="gridcell"/]],
    ["Meter", Meter, { label: "Disk usage", value: 40 }, [/role="meter"/, /aria-valuenow="40"/]],
    ["Progress", Progress, { label: "Upload", value: 30 }, [/role="progressbar"/]],
    [
      "PinInput",
      PinInput,
      { label: "Verification code", length: 4 },
      [/role="group"/, /aria-label="Character 1 of 4"/],
    ],
    ["TextField", TextField, { label: "Email" }, [/<label[^>]+for="/, /<input[^>]+id="/]],
    [
      "Combobox",
      Combobox,
      { label: "Fruit", items: [{ value: "apple", label: "Apple" }] },
      [/<label[^>]+for="/, /aria-labelledby="/],
    ],
  ];

  for (const [name, Component, props, patterns] of cases) {
    it(name, () => {
      const { body } = render(Component as Parameters<typeof render>[0], { props });
      for (const pattern of patterns) expect(body).toMatch(pattern);
    });
  }
});
