import { render } from "@testing-library/vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, markRaw, nextTick } from "vue";
import { Sidebar, type SidebarSection } from "./Sidebar";

// The tooltip stands in as a wrapper that shows the placement it was given.
vi.mock("../tooltip/Tooltip", () => ({
  Tooltip: defineComponent({
    props: { placement: String, text: String },
    setup:
      (props, { slots }) =>
      () =>
        h("span", { "data-placement": props.placement }, slots.default?.()),
  }),
}));

const Dot = markRaw({
  name: "Dot",
  render: () => h("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }),
});
const sections: SidebarSection[] = [
  { label: "Main", items: [{ value: "home", label: "Home", icon: Dot }] },
];

afterEach(() => {
  document.documentElement.removeAttribute("dir");
});

describe("Vue Sidebar rail tooltip direction", () => {
  it("places the tooltip at the inline end, on the left in right-to-left text", async () => {
    const { unmount } = render(Sidebar, { props: { sections, collapsed: true } });
    expect(document.querySelector("[data-placement]")).toHaveAttribute("data-placement", "right");
    unmount();
    document.documentElement.dir = "rtl";
    render(Sidebar, { props: { sections, collapsed: true } });
    // The page direction applies once the component has mounted.
    await nextTick();
    expect(document.querySelector("[data-placement]")).toHaveAttribute("data-placement", "left");
  });
});
