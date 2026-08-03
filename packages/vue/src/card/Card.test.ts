import { render, screen } from "@testing-library/vue";
import { h } from "vue";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Tag } from "../tag/Tag";
import { Card } from "./Card";

const card = () => document.querySelector<HTMLElement>(".card")!;

const icon = () => h("svg", { viewBox: "0 0 16 16" }, [h("rect", { width: 16, height: 16 })]);

const mediaSlots = {
  tags: () => [
    h(Tag, { status: "success" }, { default: () => "Available" }),
    h(Tag, { status: "info" }, { default: () => "New" }),
  ],
  actions: () => [
    h("button", { type: "button" }, "Details"),
    h("button", { type: "button" }, "Book"),
  ],
};

const mediaProps = {
  imageSrc: "https://example.com/photo.jpg",
  imageAlt: "A nice view",
  title: "Mountain retreat",
  description: "A quiet cabin with a view of the valley.",
};

describe("Vue Card (styled)", () => {
  it("is an article labelled by its title heading", () => {
    render(Card, { props: mediaProps, slots: mediaSlots });
    const heading = screen.getByRole("heading", { name: "Mountain retreat" });
    expect(heading.tagName).toBe("H3");
    expect(screen.getByRole("article", { name: "Mountain retreat" })).toBe(card());
  });

  it("renders the classic vertical media card with image, tags, description and actions", () => {
    render(Card, { props: mediaProps, slots: mediaSlots });
    expect(card()).toHaveAttribute("data-orientation", "vertical");
    const img = card().querySelector<HTMLImageElement>(".card__image")!;
    expect(img).toHaveAttribute("src", "https://example.com/photo.jpg");
    expect(img).toHaveAttribute("alt", "A nice view");
    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(screen.getByText("A quiet cabin with a view of the valley.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Book" })).toBeInTheDocument();
  });

  it("reflects the horizontal orientation", () => {
    render(Card, { props: { ...mediaProps, orientation: "horizontal" }, slots: mediaSlots });
    expect(card()).toHaveAttribute("data-orientation", "horizontal");
  });

  it("renders an icon in place of the image when the icon slot is used", () => {
    render(Card, {
      props: { title: "Mountain retreat", description: "A quiet cabin with a view of the valley." },
      slots: { ...mediaSlots, icon },
    });
    expect(card().querySelector(".card__image")).toBeNull();
    expect(card().querySelector(".card__media--icon .card__icon")).not.toBeNull();
  });

  it("renders the dashboard metric tile: icon, title, big value and a trend change", () => {
    render(Card, {
      props: {
        variant: "dashboard",
        title: "Revenue",
        value: "€48.2k",
        change: "+12%",
        trend: "up",
      },
      slots: { icon },
    });
    expect(card()).toHaveClass("card--dashboard");
    expect(screen.getByRole("heading", { name: "Revenue" })).toBeInTheDocument();
    expect(screen.getByText("€48.2k")).toBeInTheDocument();
    const change = screen.getByText("+12%");
    expect(change).toHaveAttribute("data-trend", "up");
  });

  it("has no accessibility violations (media)", async () => {
    const { container } = render(Card, {
      props: { ...mediaProps, orientation: "horizontal" },
      slots: mediaSlots,
    });
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations (dashboard)", async () => {
    const { container } = render(Card, {
      props: {
        variant: "dashboard",
        title: "Revenue",
        value: "€48.2k",
        change: "+12%",
        trend: "up",
      },
      slots: { icon },
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
