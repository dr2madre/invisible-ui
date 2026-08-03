import { render, screen } from "@testing-library/vue";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Skeleton } from "./Skeleton";

const root = () => document.querySelector<HTMLElement>(".skeleton")!;

describe("Vue Skeleton (styled)", () => {
  it("is decorative (hidden from assistive tech) by default", () => {
    render(Skeleton);
    expect(root()).toHaveAttribute("aria-hidden", "true");
    expect(root()).toHaveAttribute("data-variant", "text");
  });

  it("renders one bar per line for the text variant", () => {
    render(Skeleton, { props: { variant: "text", lines: 3 } });
    expect(root().querySelectorAll(".skeleton__line")).toHaveLength(3);
  });

  it("shortens the last of several lines", () => {
    render(Skeleton, { props: { variant: "text", lines: 2, width: "20rem" } });
    const lines = root().querySelectorAll<HTMLElement>(".skeleton__line");
    expect(lines[0].style.width).toBe("20rem");
    expect(lines[1].style.width).toBe("60%");
  });

  it("renders a single circle for the circle variant", () => {
    render(Skeleton, { props: { variant: "circle" } });
    expect(root().querySelector(".skeleton__circle")).not.toBeNull();
    expect(root().querySelectorAll(".skeleton__bar")).toHaveLength(1);
  });

  it("becomes a polite status with an accessible name when labelled", () => {
    render(Skeleton, { props: { label: "Loading profile" } });
    const el = screen.getByRole("status", { name: "Loading profile" });
    expect(el).toBe(root());
    expect(el).toHaveAttribute("aria-busy", "true");
    expect(el).not.toHaveAttribute("aria-hidden");
  });

  it("reflects the animation mode", () => {
    render(Skeleton, { props: { animation: "wave" } });
    expect(root()).toHaveAttribute("data-animation", "wave");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Skeleton, { props: { label: "Loading" } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
