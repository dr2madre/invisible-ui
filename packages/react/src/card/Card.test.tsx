import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Button } from "../button/Button";
import { Tag } from "../tag/Tag";
import { Card, type CardProps } from "./Card";

const card = () => document.querySelector<HTMLElement>(".card")!;

const Retreat = (props: CardProps) => (
  <Card
    title="Mountain retreat"
    description="A quiet cabin with a view of the valley."
    imageSrc="https://example.com/photo.jpg"
    imageAlt="A nice view"
    tags={<Tag status="success">Available</Tag>}
    actions={<Button variant="primary">Book</Button>}
    {...props}
  />
);

const Revenue = () => (
  <Card
    variant="dashboard"
    title="Revenue"
    value="€48.2k"
    change="+12%"
    trend="up"
    icon={<svg />}
  />
);

describe("React Card", () => {
  it("is an article named by its title heading", () => {
    render(<Retreat />);
    const heading = screen.getByRole("heading", { name: "Mountain retreat" });
    expect(heading.tagName).toBe("H3");
    expect(screen.getByRole("article", { name: "Mountain retreat" })).toBe(card());
  });

  it("renders the title at the given heading level", () => {
    render(<Retreat headingLevel={2} />);
    expect(screen.getByRole("heading", { level: 2, name: "Mountain retreat" })).toBeInTheDocument();
  });

  it("renders title markup in place of the heading, without naming the card", () => {
    render(<Retreat title={<h4 className="custom">Custom</h4>} />);
    expect(screen.getByRole("heading", { level: 4, name: "Custom" })).toHaveClass("custom");
    expect(card()).not.toHaveAttribute("aria-labelledby");
  });

  it("renders the vertical media card with image, tags, description and actions", () => {
    render(<Retreat />);
    expect(card()).toHaveClass("card", "card--media");
    expect(card()).toHaveAttribute("data-orientation", "vertical");
    const img = card().querySelector(".card__media .card__image")!;
    expect(img).toHaveAttribute("src", "https://example.com/photo.jpg");
    expect(img).toHaveAttribute("alt", "A nice view");
    expect(card().querySelector(".card__tags")).toHaveTextContent("Available");
    expect(card().querySelector(".card__description")).toHaveTextContent(
      "A quiet cabin with a view of the valley.",
    );
    expect(screen.getByRole("button", { name: "Book" }).closest(".card__actions")).not.toBeNull();
  });

  it("reflects the orientation and the surface", () => {
    render(<Retreat orientation="horizontal" surface="secondary" />);
    expect(card()).toHaveAttribute("data-orientation", "horizontal");
    expect(card()).toHaveAttribute("data-surface", "secondary");
  });

  it("renders an icon in place of the image", () => {
    render(<Retreat imageSrc={undefined} icon={<svg />} />);
    expect(card().querySelector(".card__image")).toBeNull();
    expect(card().querySelector(".card__media--icon .card__icon")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("renders custom media and extra content", () => {
    render(
      <Retreat media={<video aria-label="Tour" />}>
        <p>Sleeps four.</p>
      </Retreat>,
    );
    expect(card().querySelector(".card__media video")).not.toBeNull();
    expect(card().querySelector(".card__media")).not.toHaveClass("card__media--icon");
    expect(card().querySelector(".card__image")).toBeNull();
    expect(card().querySelector(".card__content")).toHaveTextContent("Sleeps four.");
  });

  it("renders no media area without an image, an icon or media", () => {
    render(<Retreat imageSrc={undefined} />);
    expect(card().querySelector(".card__media")).toBeNull();
  });

  it("renders the dashboard tile: icon, title, large value and a trend change", () => {
    render(<Revenue />);
    expect(card()).toHaveClass("card--dashboard");
    expect(card().querySelector(".card__dash-head .card__icon")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Revenue" })).toBeInTheDocument();
    expect(screen.getByText("€48.2k")).toHaveClass("card__value");
    expect(screen.getByText("+12%")).toHaveAttribute("data-trend", "up");
  });

  it("has no accessibility violations (media)", async () => {
    const { container } = render(<Retreat orientation="horizontal" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations (dashboard)", async () => {
    const { container } = render(<Revenue />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
