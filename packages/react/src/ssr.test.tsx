// @vitest-environment node
import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import * as adapter from "./index";

const fixtures: Record<string, ReactElement> = {
  Button: <adapter.Button>Save</adapter.Button>,
  Checkbox: <adapter.Checkbox label="Accept" />,
  Switch: <adapter.Switch label="Notifications" />,
  Select: <adapter.Select label="Fruit" items={[]} />,
  Combobox: <adapter.Combobox label="Framework" items={[]} />,
  Dialog: <adapter.Dialog title="Details">Dialog body</adapter.Dialog>,
  Icon: (
    <adapter.Icon label="Add">
      <path d="M12 5v14M5 12h14" />
    </adapter.Icon>
  ),
  LocaleProvider: (
    <adapter.LocaleProvider locale="en-US">
      <span>Localized content</span>
    </adapter.LocaleProvider>
  ),
};

const publicComponentNames = Object.entries(adapter)
  .filter(
    ([name, value]) =>
      /^[A-Z]/.test(name) &&
      (typeof value === "function" ||
        (typeof value === "object" && value !== null && "$$typeof" in value)),
  )
  .map(([name]) => name)
  .sort();

describe("React adapter SSR", () => {
  it("covers every public renderable export", () => {
    // React components are the capitalized function exports plus forwardRef
    // objects. A new public component fails here until it gets a valid fixture.
    expect(publicComponentNames).toEqual(Object.keys(fixtures).sort());
  });

  for (const [name, element] of Object.entries(fixtures)) {
    it(`server-renders ${name} without a DOM`, () => {
      const html = renderToString(element);

      expect(html.length).toBeGreaterThan(0);
    });
  }
});
