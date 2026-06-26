import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./carousel.fixture.svelte";

const carousel = () => screen.getByRole("group", { name: "Featured photos" });

describe("Svelte Carousel (styled)", () => {
  it("is a labelled carousel of 'N of M' slides", () => {
    render(Fixture);
    expect(carousel()).toHaveAttribute("aria-roledescription", "carousel");
    const slides = document.querySelectorAll(".carousel__slide");
    expect(slides).toHaveLength(3);
    expect(slides[0]).toHaveAttribute("aria-roledescription", "slide");
    expect(slides[0]).toHaveAttribute("aria-label", "1 of 3");
    // In slide mode only the active slide is exposed; the rest are aria-hidden.
    expect(slides[1]).toHaveAttribute("aria-hidden", "true");
  });

  it("renders the built-in slide overlay (title + description)", () => {
    render(Fixture);
    expect(screen.getByText("Peaks")).toBeInTheDocument();
    expect(screen.getByText("Above the clouds.")).toBeInTheDocument();
  });

  it("advances with the next button and marks the active slide", async () => {
    render(Fixture);
    const slideOne = document.querySelector('[data-index="0"]')!;
    expect(slideOne).toHaveAttribute("data-active", "");
    await fireEvent.click(screen.getByRole("button", { name: "Next slide" }));
    expect(document.querySelector('[data-index="1"]')).toHaveAttribute("data-active", "");
    expect(slideOne).not.toHaveAttribute("data-active");
  });

  it("disables the previous button at the start (no loop)", () => {
    render(Fixture);
    expect(screen.getByRole("button", { name: "Previous slide" })).toBeDisabled();
  });

  it("keeps the previous button enabled at the start when looping", () => {
    render(Fixture, { props: { loop: true } });
    expect(screen.getByRole("button", { name: "Previous slide" })).toBeEnabled();
  });

  it("jumps to a slide via its indicator dot", async () => {
    render(Fixture);
    await fireEvent.click(screen.getByRole("button", { name: "Go to slide 3" }));
    expect(document.querySelector('[data-index="2"]')).toHaveAttribute("data-active", "");
  });

  it("renders gallery items through the default slot", () => {
    render(Fixture, { props: { variant: "gallery" } });
    expect(screen.getByRole("group", { name: "Album gallery" })).toBeInTheDocument();
    expect(screen.getByText("Forest")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container)).toHaveNoViolations();
  });
});
