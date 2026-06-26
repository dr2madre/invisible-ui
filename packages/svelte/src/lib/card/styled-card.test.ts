import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./card.fixture.svelte";

const card = () => document.querySelector<HTMLElement>(".card")!;

describe("Svelte Card (styled)", () => {
  it("is an article labelled by its title heading", () => {
    render(Fixture);
    const heading = screen.getByRole("heading", { name: "Mountain retreat" });
    expect(heading.tagName).toBe("H3");
    expect(screen.getByRole("article", { name: "Mountain retreat" })).toBe(card());
  });

  it("renders the classic vertical media card with image, tags, description and actions", () => {
    render(Fixture);
    expect(card()).toHaveAttribute("data-orientation", "vertical");
    const img = card().querySelector<HTMLImageElement>(".card__image")!;
    expect(img).toHaveAttribute("src", "https://example.com/photo.jpg");
    expect(img).toHaveAttribute("alt", "A nice view");
    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(screen.getByText("A quiet cabin with a view of the valley.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Book" })).toBeInTheDocument();
  });

  it("reflects the horizontal orientation", () => {
    render(Fixture, { props: { orientation: "horizontal" } });
    expect(card()).toHaveAttribute("data-orientation", "horizontal");
  });

  it("renders an icon in place of the image when the icon slot is used", () => {
    render(Fixture, { props: { withIcon: true } });
    expect(card().querySelector(".card__image")).toBeNull();
    expect(card().querySelector(".card__media--icon .card__icon")).not.toBeNull();
  });

  it("renders the dashboard metric tile: icon, title, big value and a trend change", () => {
    render(Fixture, { props: { variant: "dashboard" } });
    expect(card()).toHaveClass("card--dashboard");
    expect(screen.getByRole("heading", { name: "Revenue" })).toBeInTheDocument();
    expect(screen.getByText("€48.2k")).toBeInTheDocument();
    const change = screen.getByText("+12%");
    expect(change).toHaveAttribute("data-trend", "up");
  });

  it("has no accessibility violations (media)", async () => {
    const { container } = render(Fixture, { props: { orientation: "horizontal" } });
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations (dashboard)", async () => {
    const { container } = render(Fixture, { props: { variant: "dashboard" } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
