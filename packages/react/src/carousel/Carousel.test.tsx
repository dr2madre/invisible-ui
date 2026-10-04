import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { LocaleProvider } from "../i18n/i18n";
import { Carousel, type CarouselProps, type CarouselSlide } from "./Carousel";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const items: CarouselSlide[] = [
  { image: "https://example.com/1.jpg", title: "Peaks", description: "Above the clouds." },
  { image: "https://example.com/2.jpg", title: "Valley", description: "Down by the river." },
  { image: "https://example.com/3.jpg", title: "Forest", description: "Among the pines." },
];

const many = (length: number): CarouselSlide[] =>
  Array.from({ length }, (_, i) => ({
    image: `https://example.com/${i + 1}.jpg`,
    title: `Slide ${i + 1}`,
    description: "",
  }));

const Example = (props: Partial<CarouselProps>) => (
  <Carousel items={items} label="Featured photos" {...props} />
);

const carousel = () => screen.getByRole("group", { name: "Featured photos" });
const slides = () => document.querySelectorAll<HTMLElement>(".carousel__slide");
const next = () => screen.getByRole("button", { name: "Next slide" });
const previous = () => screen.getByRole("button", { name: "Previous slide" });

describe("React Carousel", () => {
  it("is a labelled carousel of 'N of M' slides", () => {
    render(<Example />);
    expect(carousel()).toHaveAttribute("aria-roledescription", "carousel");
    expect(slides()).toHaveLength(3);
    expect(slides()[0]).toHaveAttribute("aria-roledescription", "slide");
    expect(slides()[0]).toHaveAttribute("aria-label", "1 of 3");
    // In slide mode only the active slide is exposed; the rest are aria-hidden.
    expect(slides()[1]).toHaveAttribute("aria-hidden", "true");
  });

  it("takes an off-screen slide out of the tab order as well", () => {
    render(<Example />);
    // Hidden from assistive technology and inert together: a link inside an
    // invisible slide must not be reachable by Tab.
    expect(slides()[0]).not.toHaveAttribute("inert");
    expect(slides()[1]).toHaveAttribute("inert");
    expect(slides()[2]).toHaveAttribute("inert");
  });

  it("renders the built-in slide overlay (title + description)", () => {
    render(<Example />);
    expect(screen.getByText("Peaks")).toBeInTheDocument();
    expect(screen.getByText("Above the clouds.")).toBeInTheDocument();
  });

  it("sets the slide image as one quoted URL, so an image value adds no declarations", () => {
    const image = "x.jpg); position: fixed; inset: 0; (";
    render(<Carousel items={[{ image, title: "One" }]} label="Photos" />);
    const bg = document.querySelector<HTMLElement>(".carousel__bg")!;
    expect(bg.style.position).toBe("");
    expect(bg.style.backgroundImage).toContain("x.jpg");
  });

  it("sets the slide image as one quoted URL in server output too", () => {
    const image = "x.jpg); position: fixed; inset: 0; (";
    const html = renderToString(<Carousel items={[{ image, title: "One" }]} label="Photos" />);
    const style = /class="carousel__bg" style="([^"]*)"/.exec(html)?.[1] ?? "";
    expect(style.replaceAll("&quot;", '"')).toBe(`background-image:url(${JSON.stringify(image)})`);
  });

  it("advances with the next button and marks the active slide", async () => {
    const user = userEvent.setup();
    render(<Example />);
    const slideOne = document.querySelector('[data-index="0"]')!;
    expect(slideOne).toHaveAttribute("data-active", "");
    await user.click(next());
    expect(document.querySelector('[data-index="1"]')).toHaveAttribute("data-active", "");
    expect(slideOne).not.toHaveAttribute("data-active");
  });

  it("disables the previous button at the start (no loop)", () => {
    render(<Example />);
    expect(previous()).toBeDisabled();
  });

  it("keeps the previous button enabled at the start when looping", () => {
    render(<Example loop />);
    expect(previous()).toBeEnabled();
  });

  it("jumps to a slide via its indicator dot", async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole("button", { name: "Go to slide 3" }));
    expect(document.querySelector('[data-index="2"]')).toHaveAttribute("data-active", "");
  });

  it("leaves the dots out when asked", () => {
    render(<Example showIndicators={false} />);
    expect(screen.queryByRole("button", { name: "Go to slide 1" })).not.toBeInTheDocument();
  });

  it("moves between slides with the arrow keys", () => {
    render(<Example />);
    fireEvent.keyDown(carousel(), { key: "ArrowRight" });
    expect(document.querySelector('[data-index="1"]')).toHaveAttribute("data-active", "");
    fireEvent.keyDown(carousel(), { key: "ArrowLeft" });
    expect(document.querySelector('[data-index="0"]')).toHaveAttribute("data-active", "");
  });

  it("renders gallery items through renderItem", () => {
    render(
      <Carousel
        items={items}
        variant="gallery"
        label="Album gallery"
        renderItem={({ item, index, active }) => (
          <article className="album" data-current={active ? "" : undefined}>
            <span className="album__cover">{index + 1}</span>
            <span className="album__title">{item.title}</span>
          </article>
        )}
      />,
    );
    expect(screen.getByRole("group", { name: "Album gallery" })).toBeInTheDocument();
    expect(screen.getByText("Forest")).toBeInTheDocument();
    expect(document.querySelectorAll(".album[data-current]")).toHaveLength(1);
    // Every gallery item stays on screen, so none is hidden or inert.
    expect(document.querySelectorAll(".carousel__slide[inert]")).toHaveLength(0);
  });

  it("positions coverflow slides from their offset to the active one", () => {
    render(<Example variant="coverflow" index={1} />);
    const active = document.querySelector<HTMLElement>('[data-index="1"]')!;
    expect(active.style.transform).toContain("scale(1.000)");
    const neighbour = document.querySelector<HTMLElement>('[data-index="2"]')!;
    expect(neighbour.style.transform).toContain("rotateY(-18deg)");
  });

  it("moves the track the other way in right-to-left text", () => {
    render(
      <LocaleProvider dir="rtl">
        <Example index={1} />
      </LocaleProvider>,
    );
    const track = document.querySelector<HTMLElement>(".carousel__track")!;
    expect(track.style.transform).toBe("translateX(calc(1 * 1 * 100%))");
  });

  it("follows the visual order of the arrow keys in right-to-left text", () => {
    render(<Example />);
    carousel().setAttribute("dir", "rtl");
    // The next slide sits to the left, so ArrowLeft moves forward.
    fireEvent.keyDown(carousel(), { key: "ArrowLeft" });
    expect(slides()[1]).toHaveAttribute("data-active", "");
    fireEvent.keyDown(carousel(), { key: "ArrowRight" });
    expect(slides()[0]).toHaveAttribute("data-active", "");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Example />);
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });

  // The orientation decides the keyboard map: a stack of slides moves with
  // Up and Down, a row with Left and Right.
  it("moves a vertical carousel with the up and down keys", () => {
    render(<Example orientation="vertical" />);
    expect(carousel()).toHaveAttribute("data-orientation", "vertical");

    fireEvent.keyDown(carousel(), { key: "ArrowDown" });
    expect(slides()[1]).toHaveAttribute("data-active", "");

    fireEvent.keyDown(carousel(), { key: "ArrowRight" });
    expect(slides()[1], "a row's keys do not move a stack").toHaveAttribute("data-active", "");
  });

  it("moves a horizontal carousel with the left and right keys", () => {
    render(<Example />);
    expect(carousel()).toHaveAttribute("data-orientation", "horizontal");
    fireEvent.keyDown(carousel(), { key: "ArrowRight" });
    expect(slides()[1]).toHaveAttribute("data-active", "");
    fireEvent.keyDown(carousel(), { key: "ArrowDown" });
    expect(slides()[1], "a stack's keys do not move a row").toHaveAttribute("data-active", "");
  });
});

// The slide count follows the items after mount. A carousel fed by a fetch or
// a filter must keep one active slide in reach when the list changes length.
describe("React Carousel (items after mount)", () => {
  it("follows a shorter list, keeping one active slide in reach", async () => {
    const user = userEvent.setup();
    const five = many(5);
    const { rerender } = render(<Example items={five} />);
    for (let i = 0; i < 4; i++) await user.click(next());
    expect(slides()[4]).toHaveAttribute("data-active");

    rerender(<Example items={five.slice(0, 3)} />);
    expect(slides()).toHaveLength(3);
    expect(document.querySelectorAll(".carousel__slide[data-active]")).toHaveLength(1);
    expect(slides()[2], "the index is clamped to the last slide").toHaveAttribute("data-active");
    expect(slides()[2]).toHaveAttribute("aria-label", "3 of 3");
    expect(previous()).toBeEnabled();
  });

  it("follows a longer list, so the labels and Next agree with it", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Example />);
    await user.click(next());
    await user.click(next());
    expect(next(), "at the end of three").toBeDisabled();

    rerender(<Example items={many(5)} />);
    expect(slides()[2]).toHaveAttribute("aria-label", "3 of 5");
    expect(next(), "two more slides are ahead").toBeEnabled();
  });
});

// `index` is a controllable mirror: a new prop is reflected without a report,
// and each user move reports once.
describe("React Carousel (controllable index)", () => {
  it("reflects a new index prop without reporting it", () => {
    const onIndexChange = vi.fn();
    const { rerender } = render(<Example index={0} onIndexChange={onIndexChange} />);

    rerender(<Example index={2} onIndexChange={onIndexChange} />);

    expect(slides()[2]).toHaveAttribute("data-active", "");
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it("reports each user move exactly once", async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    render(<Example onIndexChange={onIndexChange} />);

    await user.click(next());
    expect(onIndexChange).toHaveBeenCalledTimes(1);
    expect(onIndexChange).toHaveBeenLastCalledWith(1);

    await user.click(screen.getByRole("button", { name: "Go to slide 3" }));
    expect(onIndexChange).toHaveBeenCalledTimes(2);
    expect(onIndexChange).toHaveBeenLastCalledWith(2);

    fireEvent.keyDown(carousel(), { key: "ArrowLeft" });
    expect(onIndexChange).toHaveBeenCalledTimes(3);
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
  });

  it("reports nothing for a move to the slide already shown", async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    render(<Example onIndexChange={onIndexChange} />);

    await user.click(screen.getByRole("button", { name: "Go to slide 1" }));
    fireEvent.keyDown(carousel(), { key: "Home" });

    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it("clamps the index into a shorter list silently, then reports the next move", async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    const five = many(5);
    const { rerender } = render(<Example items={five} index={4} onIndexChange={onIndexChange} />);

    rerender(<Example items={five.slice(0, 3)} index={4} onIndexChange={onIndexChange} />);
    expect(slides()[2]).toHaveAttribute("data-active", "");
    expect(onIndexChange, "a clamp is not a choice the user made").not.toHaveBeenCalled();

    await user.click(previous());
    expect(slides()[1]).toHaveAttribute("data-active", "");
    expect(onIndexChange).toHaveBeenCalledTimes(1);
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });
});
