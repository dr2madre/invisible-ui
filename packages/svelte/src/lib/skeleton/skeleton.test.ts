import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./skeleton.fixture.svelte";

const root = () => document.querySelector<HTMLElement>(".skeleton")!;

describe("Skeleton", () => {
  it("is decorative (hidden from assistive tech) by default", () => {
    render(Fixture);
    expect(root()).toHaveAttribute("aria-hidden", "true");
    expect(root()).toHaveAttribute("data-variant", "text");
  });

  it("renders one bar per line for the text variant", () => {
    render(Fixture, { props: { variant: "text", lines: 3 } });
    expect(root().querySelectorAll(".skeleton__line")).toHaveLength(3);
  });

  it("renders a single circle for the circle variant", () => {
    render(Fixture, { props: { variant: "circle" } });
    expect(root().querySelector(".skeleton__circle")).not.toBeNull();
    expect(root().querySelectorAll(".skeleton__bar")).toHaveLength(1);
  });

  it("becomes a polite status with an accessible name when labelled", () => {
    render(Fixture, { props: { label: "Loading profile" } });
    const el = screen.getByRole("status", { name: "Loading profile" });
    expect(el).toBe(root());
    expect(el).toHaveAttribute("aria-busy", "true");
    expect(el).not.toHaveAttribute("aria-hidden");
  });

  it("reflects the animation mode", () => {
    render(Fixture, { props: { animation: "wave" } });
    expect(root()).toHaveAttribute("data-animation", "wave");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { label: "Loading" } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
