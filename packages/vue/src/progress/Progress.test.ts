import { render, screen } from "@testing-library/vue";
import { defineComponent, h, type PropType } from "vue";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Progress } from "./Progress";
import { useProgress } from "./use-progress";

describe("Vue Progress (styled)", () => {
  it("renders a labelled determinate bar and sizes the fill", () => {
    const { container } = render(Progress, { props: { value: 25, label: "Loading" } });
    const bar = screen.getByRole("progressbar", { name: "Loading" });
    expect(bar).toHaveAttribute("aria-valuenow", "25");
    const fill = container.querySelector(".progress__indicator")!;
    expect(fill.getAttribute("style")).toContain("inline-size: 25%");
  });

  it("is determinate by design: zero renders an empty fill, never a sweep", () => {
    const { container } = render(Progress, { props: { value: 0, label: "Achievements" } });
    const bar = screen.getByRole("progressbar", { name: "Achievements" });
    expect(bar).toHaveAttribute("aria-valuenow", "0");
    const fill = container.querySelector(".progress__indicator")!;
    expect(fill.getAttribute("style")).toContain("inline-size: 0%");
  });

  it("tracks value changes", async () => {
    const { rerender } = render(Progress, { props: { value: 30, label: "Upload" } });
    await rerender({ value: 80, label: "Upload" });
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "80");
  });

  it("renders a determinate circle whose ring maps the percentage", () => {
    const { container } = render(Progress, {
      props: { value: 40, label: "Exporting", shape: "circle", showValue: true },
    });
    const bar = screen.getByRole("progressbar", { name: "Exporting" });
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    const ring = container.querySelector(".progress__ring")!;
    expect(ring.getAttribute("style")).toContain("stroke-dasharray: 40 100");
    expect(container.querySelector(".progress__value")).toHaveTextContent("40%");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Progress, { props: { value: 70, label: "Loading" } });
    expect(await axe(container)).toHaveNoViolations();
  });
});

/**
 * The headless layer with markup the consumer owns, the reason the composable
 * is exported. Nothing here uses the styled `Progress`.
 */
const Bare = defineComponent({
  props: {
    value: { type: Number as PropType<number | null>, default: 40 },
  },
  setup(props) {
    const { api } = useProgress({ value: props.value });

    return () =>
      h("div", { ...api.value.rootProps, "aria-label": "Upload progress" }, [
        h("div", api.value.indicatorProps),
      ]);
  },
});

describe("useProgress (headless)", () => {
  it("exposes the progressbar role with ARIA value for a determinate bar", () => {
    render(Bare, { props: { value: 40 } });
    const bar = screen.getByRole("progressbar", { name: "Upload progress" });
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(bar).toHaveAttribute("data-state", "loading");
  });

  it("marks completion at the maximum", () => {
    render(Bare, { props: { value: 100 } });
    expect(screen.getByRole("progressbar")).toHaveAttribute("data-state", "complete");
  });

  it("omits aria-valuenow when indeterminate", () => {
    render(Bare, { props: { value: null } });
    const bar = screen.getByRole("progressbar");
    expect(bar).not.toHaveAttribute("aria-valuenow");
    expect(bar).toHaveAttribute("data-state", "indeterminate");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Bare, { props: { value: 60 } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
