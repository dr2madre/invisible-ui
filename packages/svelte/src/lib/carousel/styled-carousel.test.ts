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

  it("takes an off-screen slide out of the tab order as well", () => {
    render(Fixture);
    const slides = document.querySelectorAll(".carousel__slide");
    // Hidden from assistive technology and inert together: a link inside an
    // invisible slide must not be reachable by Tab.
    expect((slides[0] as HTMLElement).inert).toBeFalsy();
    expect(slides[1]).toHaveAttribute("aria-hidden", "true");
    expect((slides[1] as HTMLElement).inert).toBe(true);
    expect((slides[2] as HTMLElement).inert).toBe(true);
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

  // The slide count follows the items after mount (ADR 0011). A carousel fed
  // by a fetch or a filter once kept the old count: after advancing to the
  // fifth of five and being given three, no slide was active and Next was
  // disabled, with no way back for the user.
  it("follows a shorter list after mount, keeping one active slide in reach", async () => {
    const five = Array.from({ length: 5 }, (_, i) => ({
      image: `https://example.com/${i + 1}.jpg`,
      title: `Slide ${i + 1}`,
      description: "",
    }));
    const { rerender } = render(Fixture, { props: { items: five } });
    const next = () => screen.getByRole("button", { name: "Next slide" });
    for (let i = 0; i < 4; i++) await fireEvent.click(next());
    expect(document.querySelectorAll(".carousel__slide")[4]).toHaveAttribute("data-active");
    await rerender({ items: five.slice(0, 3) });
    const slides = document.querySelectorAll(".carousel__slide");
    expect(slides).toHaveLength(3);
    expect(document.querySelectorAll(".carousel__slide[data-active]")).toHaveLength(1);
    expect(slides[2], "the index is clamped to the last slide").toHaveAttribute("data-active");
    expect(slides[2]).toHaveAttribute("aria-label", "3 of 3");
    expect(screen.getByRole("button", { name: "Previous slide" })).toBeEnabled();
  });

  it("follows a longer list after mount, so the labels and Next agree with it", async () => {
    const { rerender } = render(Fixture);
    const next = () => screen.getByRole("button", { name: "Next slide" });
    await fireEvent.click(next());
    await fireEvent.click(next());
    expect(next(), "at the end of three").toBeDisabled();
    const five = Array.from({ length: 5 }, (_, i) => ({
      image: `https://example.com/${i + 1}.jpg`,
      title: `Slide ${i + 1}`,
      description: "",
    }));
    await rerender({ items: five });
    expect(document.querySelectorAll(".carousel__slide")[2]).toHaveAttribute(
      "aria-label",
      "3 of 5",
    );
    expect(next(), "two more slides are ahead").toBeEnabled();
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

  // The orientation decides the keyboard map: a stack of slides moves with
  // Up and Down, a row with Left and Right.
  it("moves a vertical carousel with the up and down keys", async () => {
    render(Fixture, { props: { orientation: "vertical" } });
    expect(carousel()).toHaveAttribute("data-orientation", "vertical");

    await fireEvent.keyDown(carousel(), { key: "ArrowDown" });
    expect(document.querySelectorAll(".carousel__slide")[1]).toHaveAttribute("data-active", "");

    await fireEvent.keyDown(carousel(), { key: "ArrowRight" });
    expect(
      document.querySelectorAll(".carousel__slide")[1],
      "a row's keys do not move a stack",
    ).toHaveAttribute("data-active", "");
  });

  it("moves a horizontal carousel with the left and right keys", async () => {
    render(Fixture);
    expect(carousel()).toHaveAttribute("data-orientation", "horizontal");
    await fireEvent.keyDown(carousel(), { key: "ArrowRight" });
    expect(document.querySelectorAll(".carousel__slide")[1]).toHaveAttribute("data-active", "");
    await fireEvent.keyDown(carousel(), { key: "ArrowDown" });
    expect(
      document.querySelectorAll(".carousel__slide")[1],
      "a stack's keys do not move a row",
    ).toHaveAttribute("data-active", "");
  });
});
