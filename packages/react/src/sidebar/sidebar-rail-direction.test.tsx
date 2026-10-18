import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Sidebar, type SidebarSection } from "./Sidebar";

// The tooltip stands in as a wrapper that shows the placement it was given.
vi.mock("../tooltip/Tooltip", () => ({
  Tooltip: ({ placement, children }: { placement?: string; children: ReactNode }) => (
    <span data-placement={placement}>{children}</span>
  ),
}));

const dot = (
  <svg viewBox="0 0 24 24" width="1em" height="1em">
    <circle cx="12" cy="12" r="4" />
  </svg>
);
const sections: SidebarSection[] = [
  { label: "Main", items: [{ value: "home", label: "Home", icon: dot }] },
];

afterEach(() => {
  document.documentElement.removeAttribute("dir");
});

describe("React Sidebar rail tooltip direction", () => {
  it("places the tooltip at the inline end, on the left in right-to-left text", () => {
    const { unmount } = render(<Sidebar sections={sections} collapsed />);
    expect(document.querySelector("[data-placement]")).toHaveAttribute("data-placement", "right");
    unmount();
    document.documentElement.dir = "rtl";
    render(<Sidebar sections={sections} collapsed />);
    expect(document.querySelector("[data-placement]")).toHaveAttribute("data-placement", "left");
  });
});
