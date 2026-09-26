import { fireEvent, screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, vi } from "vitest";
import { axe } from "vitest-axe";
import "../define";
import type { DsLocaleProvider } from "../locale-provider/ds-locale-provider";
import type { CarouselSlide, DsCarousel } from "./ds-carousel";

const ITEMS: CarouselSlide[] = [
  { image: "https://example.com/1.jpg", title: "Peaks", description: "Above the clouds." },
  { image: "https://example.com/2.jpg", title: "Valley", description: "Down by the river." },
  { image: "https://example.com/3.jpg", title: "Forest", description: "Among the pines." },
];

const numbered = (length: number): CarouselSlide[] =>
  Array.from({ length }, (_, i) => ({
    image: `https://example.com/${i + 1}.jpg`,
    title: `Slide ${i + 1}`,
  }));

const mount = (attributes = "", items: CarouselSlide[] = ITEMS) => {
  document.body.innerHTML = `<main><ds-carousel label="Featured photos" ${attributes}></ds-carousel></main>`;
  const host = document.querySelector("ds-carousel") as DsCarousel;
  host.items = items;
  return host;
};

const carousel = () => screen.getByRole("group", { name: "Featured photos" });
const slides = () => Array.from(document.querySelectorAll<HTMLElement>(".carousel__slide"));
const next = () => screen.getByRole("button", { name: "Next slide" });
const prev = () => screen.getByRole("button", { name: "Previous slide" });

afterEach(() => {
  document.body.innerHTML = "";
});

describe("<ds-carousel>", () => {
  it("is a labelled carousel of 'N of M' slides", () => {
    mount();
    expect(carousel()).toHaveAttribute("aria-roledescription", "carousel");
    expect(carousel()).toHaveClass("carousel");
    expect(carousel()).toHaveAttribute("data-variant", "slide");
    expect(slides()).toHaveLength(3);
    expect(slides()[0]).toHaveAttribute("aria-roledescription", "slide");
    expect(slides()[0]).toHaveAttribute("aria-label", "1 of 3");
    // In slide mode only the active slide is exposed; the rest are aria-hidden.
    expect(slides()[1]).toHaveAttribute("aria-hidden", "true");
  });

  it("takes an off-screen slide out of the tab order as well", () => {
    mount();
    expect(slides()[0]).not.toHaveAttribute("inert");
    expect(slides()[1]).toHaveAttribute("aria-hidden", "true");
    expect(slides()[1]).toHaveAttribute("inert");
    expect(slides()[2]).toHaveAttribute("inert");
  });

  it("renders the built-in slide overlay (title + description)", () => {
    mount();
    expect(screen.getByText("Peaks")).toHaveClass("carousel__title");
    expect(screen.getByText("Above the clouds.")).toHaveClass("carousel__desc");
  });

  it("keeps hostile item text as text and the image URL as one value", () => {
    mount("", [{ title: "<img src=x onerror=alert(1)>", image: 'x") ; color: red; ("' }]);
    const bg = document.querySelector<HTMLElement>(".carousel__bg")!;
    expect(bg.querySelector("img")).toBeNull();
    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
    expect(bg.style.color).toBe("");
  });

  it("advances with the next button, marks the active slide and reports it", async () => {
    const user = userEvent.setup();
    const host = mount();
    const change = vi.fn();
    host.addEventListener("change", (event) => change((event as CustomEvent).detail));
    expect(slides()[0]).toHaveAttribute("data-active", "");
    await user.click(next());
    expect(slides()[1]).toHaveAttribute("data-active", "");
    expect(slides()[0]).not.toHaveAttribute("data-active");
    expect(slides()[1]).not.toHaveAttribute("inert");
    expect(change).toHaveBeenCalledWith({ index: 1 });
    expect(host.index).toBe(1);
    expect(host).toHaveAttribute("index", "1");
  });

  it("hands focus to the other arrow when the focused one turns disabled", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(next());
    await user.click(next());
    expect(next()).toBeDisabled();
    expect(prev()).toHaveFocus();
    await user.click(prev());
    await user.click(prev());
    expect(prev()).toBeDisabled();
    expect(next()).toHaveFocus();
  });

  it("disables the previous button at the start (no loop)", () => {
    mount();
    expect(prev()).toBeDisabled();
  });

  it("keeps the previous button enabled at the start when looping", async () => {
    const user = userEvent.setup();
    mount("loop");
    expect(prev()).toBeEnabled();
    await user.click(prev());
    expect(slides()[2]).toHaveAttribute("data-active", "");
  });

  it("jumps to a slide via its indicator dot", async () => {
    const user = userEvent.setup();
    mount();
    const dot = screen.getByRole("button", { name: "Go to slide 3" });
    await user.click(dot);
    expect(slides()[2]).toHaveAttribute("data-active", "");
    expect(dot).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("group", { name: "Choose slide" })).toBeInTheDocument();
  });

  it("hides the dots with show-indicators=false", () => {
    mount('show-indicators="false"');
    expect(screen.queryByRole("button", { name: /Go to slide/ })).toBeNull();
    expect(document.querySelector(".carousel__indicators")).toBeNull();
  });

  it("follows the index attribute and property without reporting a change", () => {
    const host = mount();
    const change = vi.fn();
    host.addEventListener("change", change);
    host.setAttribute("index", "2");
    expect(slides()[2]).toHaveAttribute("data-active", "");
    host.index = 9;
    expect(host.index, "clamped to the last slide").toBe(2);
    host.index = 0;
    expect(slides()[0]).toHaveAttribute("data-active", "");
    expect(change).not.toHaveBeenCalled();
  });

  it("follows a shorter list after mount, keeping one active slide in reach", async () => {
    const user = userEvent.setup();
    const host = mount("", numbered(5));
    for (let i = 0; i < 4; i++) await user.click(next());
    expect(slides()[4]).toHaveAttribute("data-active");
    host.items = numbered(3);
    expect(slides()).toHaveLength(3);
    expect(document.querySelectorAll(".carousel__slide[data-active]")).toHaveLength(1);
    expect(slides()[2], "the index is clamped to the last slide").toHaveAttribute("data-active");
    expect(slides()[2]).toHaveAttribute("aria-label", "3 of 3");
    expect(prev()).toBeEnabled();
  });

  it("follows a longer list after mount, so the labels and Next agree with it", async () => {
    const user = userEvent.setup();
    const host = mount();
    await user.click(next());
    await user.click(next());
    expect(next(), "at the end of three").toBeDisabled();
    host.items = numbered(5);
    expect(slides()[2]).toHaveAttribute("aria-label", "3 of 5");
    expect(next(), "two more slides are ahead").toBeEnabled();
  });

  it("turns element children into slides, one per child", () => {
    document.body.innerHTML = `<ds-carousel label="Album gallery" variant="gallery">
      <article class="album">Blue</article>
      <article class="album">Red</article>
      <article class="album"><a href="#green">Green</a></article>
    </ds-carousel>`;
    const gallery = screen.getByRole("group", { name: "Album gallery" });
    expect(gallery).toHaveAttribute("data-variant", "gallery");
    expect(slides()).toHaveLength(3);
    expect(slides()[2]).toContainElement(screen.getByRole("link", { name: "Green" }));
    // A gallery shows every item, so none is hidden, and its viewport scrolls.
    expect(slides()[1]).not.toHaveAttribute("aria-hidden");
    expect(slides()[1]).not.toHaveAttribute("inert");
    expect(document.querySelector(".carousel__viewport")).toHaveAttribute("tabindex", "0");
  });

  it("positions coverflow slides from their offset to the active one", () => {
    mount('variant="coverflow"');
    const [first, second] = slides();
    expect(first!.style.transform).toContain("scale(1.000)");
    expect(first!.style.zIndex).toBe("100");
    expect(second!.style.transform).toContain("translateX");
    expect(second!.style.zIndex).toBe("99");
    expect(second).toHaveAttribute("inert");
  });

  it("has no accessibility violations", async () => {
    mount();
    expect(await axe(document.body)).toHaveNoViolations();
  });

  // The orientation decides the keyboard map: a stack of slides moves with
  // Up and Down, a row with Left and Right.
  it("moves a vertical carousel with the up and down keys", () => {
    mount('orientation="vertical"');
    expect(carousel()).toHaveAttribute("data-orientation", "vertical");
    fireEvent.keyDown(carousel(), { key: "ArrowDown" });
    expect(slides()[1]).toHaveAttribute("data-active", "");
    fireEvent.keyDown(carousel(), { key: "ArrowRight" });
    expect(slides()[1], "a row's keys do not move a stack").toHaveAttribute("data-active", "");
    fireEvent.keyDown(carousel(), { key: "ArrowUp" });
    expect(slides()[0]).toHaveAttribute("data-active", "");
  });

  it("moves a horizontal carousel with the left and right keys", () => {
    mount();
    expect(carousel()).toHaveAttribute("data-orientation", "horizontal");
    fireEvent.keyDown(carousel(), { key: "ArrowRight" });
    expect(slides()[1]).toHaveAttribute("data-active", "");
    fireEvent.keyDown(carousel(), { key: "ArrowDown" });
    expect(slides()[1], "a stack's keys do not move a row").toHaveAttribute("data-active", "");
    fireEvent.keyDown(carousel(), { key: "ArrowLeft" });
    expect(slides()[0]).toHaveAttribute("data-active", "");
  });

  it("localizes every default string, and the label attributes still win", () => {
    document.body.innerHTML = `<ds-locale-provider locale="it">
      <ds-carousel label="Foto in evidenza"></ds-carousel>
    </ds-locale-provider>`;
    const host = document.querySelector("ds-carousel") as DsCarousel;
    host.items = ITEMS;
    (document.querySelector("ds-locale-provider") as DsLocaleProvider).messages = {
      "carousel.previous": "Slide precedente",
      "carousel.next": "Slide successiva",
      "carousel.choose": "Scegli slide",
      "carousel.slide": "{index} di {count}",
      "carousel.goTo": "Vai alla slide {index}",
      "carousel.roleDescription": "carosello",
      "carousel.slideRoleDescription": "diapositiva",
    };
    const root = screen.getByRole("group", { name: "Foto in evidenza" });
    expect(root).toHaveAttribute("aria-roledescription", "carosello");
    expect(slides()[0]).toHaveAttribute("aria-label", "1 di 3");
    expect(slides()[0]).toHaveAttribute("aria-roledescription", "diapositiva");
    expect(screen.getByRole("button", { name: "Slide precedente" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Slide successiva" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Scegli slide" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vai alla slide 2" })).toBeInTheDocument();

    host.setAttribute("next-label", "Avanti");
    host.setAttribute("prev-label", "Indietro");
    expect(screen.getByRole("button", { name: "Avanti" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Indietro" })).toBeInTheDocument();
  });
});
