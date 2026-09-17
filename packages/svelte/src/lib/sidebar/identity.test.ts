import { describe, expect, it, vi } from "vitest";

// The production path: a consumer's mistake throws in development, and here it
// falls back, so this file asserts what the fallback actually does.
vi.mock("../internal/dev", () => ({ DEV: false, fail: () => {} }));

const { canRail, resolveSections } = await import("./identity");

const item = { value: "a", label: "A" };

describe("the name each section answers to", () => {
  it("keeps a collapsible section's own id", () => {
    const ids = resolveSections([
      { id: "reports", label: "Reports", collapsible: true, items: [item] },
    ]).map((entry) => entry.id);
    expect(ids).toEqual(["reports"]);
  });

  it.each([
    {
      name: "a plain section and a collapsible one claiming one id",
      sections: [
        { id: "reports", label: "Plain", items: [item] },
        { id: "reports", label: "Group", collapsible: true, items: [item] },
      ],
    },
    {
      name: "a positional name already taken by an id",
      sections: [
        { label: "Plain", items: [item] },
        { id: "0", label: "Group", collapsible: true, items: [item] },
      ],
    },
    {
      name: "a section with no id landing on a taken position",
      sections: [
        { id: "1", label: "One", collapsible: true, items: [item] },
        { label: "Two", collapsible: true, items: [item] },
      ],
    },
    {
      name: "three sections claiming one id",
      sections: [
        { id: "x", label: "A", collapsible: true, items: [item] },
        { id: "x", label: "B", collapsible: true, items: [item] },
        { id: "x", label: "C", collapsible: true, items: [item] },
      ],
    },
  ])("never hands the same name to two sections: $name", ({ sections }) => {
    const ids = resolveSections(sections as never).map((entry) => entry.id);
    // Sharing a name means sharing an open state, and keying a list by it
    // means a renderer that cannot tell the two apart.
    expect(new Set(ids).size, `shared a name: ${ids.join(", ")}`).toBe(ids.length);
  });

  it("answers to the same names whatever the order it is called in", () => {
    const sections = [
      { id: "x", label: "A", collapsible: true, items: [item] },
      { id: "x", label: "B", collapsible: true, items: [item] },
    ];
    const first = resolveSections(sections as never).map((entry) => entry.id);
    const second = resolveSections(sections as never).map((entry) => entry.id);
    expect(second).toEqual(first);
  });
});

describe("whether the rail can be offered", () => {
  const icon = {} as never;

  it("needs an icon on every destination", () => {
    expect(canRail([{ label: "Main", items: [{ ...item, icon }] }])).toBe(true);
    expect(canRail([{ label: "Main", items: [{ ...item, icon }, item] }])).toBe(false);
    expect(
      canRail([
        { label: "Main", items: [{ ...item, icon }] },
        { id: "g", label: "G", collapsible: true, items: [item] },
      ]),
      "a destination inside a section that is closed is still a destination",
    ).toBe(false);
  });
});
