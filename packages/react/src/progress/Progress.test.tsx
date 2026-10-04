import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Progress } from "./Progress";
import { useProgress } from "./use-progress";

const indicator = () => document.querySelector<HTMLElement>(".progress__indicator")!;

function HeadlessProgress({ value }: { value: number | null }) {
  const api = useProgress({ value, id: "upload" });
  return (
    <div {...api.rootProps} aria-label="Upload">
      <div {...api.indicatorProps} className="fill" />
    </div>
  );
}

describe("React Progress", () => {
  it("renders a labelled determinate bar and sizes the fill", () => {
    render(<Progress value={40} label="Profile completion" />);
    const bar = screen.getByRole("progressbar", { name: "Profile completion" });
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(bar).toHaveAttribute("data-state", "loading");
    expect(indicator().style.inlineSize).toBe("40%");
  });

  it("is determinate by design: zero renders an empty fill", () => {
    render(<Progress label="Steps" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    expect(indicator().style.inlineSize).toBe("0%");
  });

  it("marks completion at the maximum", () => {
    render(<Progress value={5} max={5} label="Steps" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("data-state", "complete");
    expect(indicator()).toHaveAttribute("data-state", "complete");
  });

  it("renders a determinate circle whose ring maps the percentage", () => {
    render(<Progress shape="circle" value={25} showValue label="Export" />);
    const bar = screen.getByRole("progressbar", { name: "Export" });
    expect(bar).toHaveClass("progress", "progress--circle");
    expect(bar.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(bar.querySelector<SVGElement>(".progress__ring")!.style.strokeDasharray).toBe("25 100");
    expect(bar.querySelector(".progress__value")).toHaveTextContent("25%");
  });

  it("follows the value, min and max changed after mount", () => {
    const { rerender } = render(<Progress value={50} label="Steps" />);
    rerender(<Progress value={50} min={0} max={200} label="Steps" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuemax", "200");
    expect(indicator().style.inlineSize).toBe("25%");
    rerender(<Progress value={150} min={0} max={200} label="Steps" />);
    expect(bar).toHaveAttribute("aria-valuenow", "150");
    expect(indicator().style.inlineSize).toBe("75%");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <>
        <Progress value={40} label="Profile completion" />
        <Progress shape="circle" value={60} showValue label="Export" />
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("useProgress (headless)", () => {
  it("omits aria-valuenow when the value is unknown", () => {
    render(<HeadlessProgress value={null} />);
    const bar = screen.getByRole("progressbar", { name: "Upload" });
    expect(bar).not.toHaveAttribute("aria-valuenow");
    expect(bar).toHaveAttribute("data-state", "indeterminate");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<HeadlessProgress value={30} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
