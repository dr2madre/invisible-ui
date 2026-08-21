import { fireEvent, render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { h } from "vue";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Carousel, type CarouselSlide } from "./Carousel";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const items: CarouselSlide[] = [
  { image: "https://example.com/1.jpg", title: "Peaks", description: "Above the clouds." },
  { image: "https://example.com/2.jpg", title: "Valley", description: "Down by the river." },
  { image: "https://example.com/3.jpg", title: "Forest", description: "Among the pines." },
];

const setup = (props: Record<string, unknown> = {}) =>
  render(Carousel, { props: { items, label: "Featured photos", ...props } });

const carousel = () => screen.getByRole("group", { name: "Featured photos" });

describe("Vue Carousel", () => {
  it("is a labelled carousel of 'N of M' slides", () => {
    setup();
    expect(carousel()).toHaveAttribute("aria-roledescription", "carousel");
    const slides = document.querySelectorAll(".carousel__slide");
    expect(slides).toHaveLength(3);
    expect(slides[0]).toHaveAttribute("aria-roledescription", "slide");
    expect(slides[0]).toHaveAttribute("aria-label", "1 of 3");
    // In slide mode only the active slide is exposed; the rest are aria-hidden.
    expect(slides[1]).toHaveAttribute("aria-hidden", "true");
  });

  it("takes an off-screen slide out of the tab order as well", () => {
    setup();
    const slides = document.querySelectorAll(".carousel__slide");
    // Hidden from assistive technology and inert together: a link inside an
    // invisible slide must not be reachable by Tab.
    expect(slides[0]).not.toHaveAttribute("inert");
    expect(slides[1]).toHaveAttribute("inert");
    expect(slides[2]).toHaveAttribute("inert");
  });

  it("renders the built-in slide overlay (title + description)", () => {
    setup();
    expect(screen.getByText("Peaks")).toBeInTheDocument();
    expect(screen.getByText("Above the clouds.")).toBeInTheDocument();
  });

  it("advances with the next button and marks the active slide", async () => {
    const user = userEvent.setup();
    setup();
    const slideOne = document.querySelector('[data-index="0"]')!;
    expect(slideOne).toHaveAttribute("data-active", "");
    await user.click(screen.getByRole("button", { name: "Next slide" }));
    expect(document.querySelector('[data-index="1"]')).toHaveAttribute("data-active", "");
    expect(slideOne).not.toHaveAttribute("data-active");
  });

  it("disables the previous button at the start (no loop)", () => {
    setup();
    expect(screen.getByRole("button", { name: "Previous slide" })).toBeDisabled();
  });

  it("keeps the previous button enabled at the start when looping", () => {
    setup({ loop: true });
    expect(screen.getByRole("button", { name: "Previous slide" })).toBeEnabled();
  });

  it("jumps to a slide via its indicator dot", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "Go to slide 3" }));
    expect(document.querySelector('[data-index="2"]')).toHaveAttribute("data-active", "");
  });

  it("moves between slides with the arrow keys", async () => {
    setup();
    await fireEvent.keyDown(carousel(), { key: "ArrowRight" });
    expect(document.querySelector('[data-index="1"]')).toHaveAttribute("data-active", "");
    await fireEvent.keyDown(carousel(), { key: "ArrowLeft" });
    expect(document.querySelector('[data-index="0"]')).toHaveAttribute("data-active", "");
  });

  it("reports the new slide through v-model", async () => {
    const user = userEvent.setup();
    const { emitted } = setup();
    await user.click(screen.getByRole("button", { name: "Next slide" }));
    expect(emitted()["update:index"]).toEqual([[1]]);
  });

  it("renders gallery items through the default slot", () => {
    render(Carousel, {
      props: { items, variant: "gallery", label: "Album gallery" },
      slots: {
        default: ({ item, index }: { item: CarouselSlide; index: number }) =>
          h("article", { class: "album" }, [
            h("span", { class: "album__cover" }, String(index + 1)),
            h("span", { class: "album__title" }, item.title),
          ]),
      },
    });
    expect(screen.getByRole("group", { name: "Album gallery" })).toBeInTheDocument();
    expect(screen.getByText("Forest")).toBeInTheDocument();
  });

  it("positions coverflow slides from their offset to the active one", () => {
    setup({ variant: "coverflow", index: 1 });
    const active = document.querySelector<HTMLElement>('[data-index="1"]')!;
    expect(active.style.transform).toContain("scale(1.000)");
    const neighbour = document.querySelector<HTMLElement>('[data-index="2"]')!;
    expect(neighbour.style.transform).toContain("rotateY(-18deg)");
  });

  it("has no accessibility violations", async () => {
    const { container } = setup();
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
