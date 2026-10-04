import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { LocaleProvider } from "../i18n/i18n";
import { RatingGroup } from "./RatingGroup";

const group = () => screen.getByRole("radiogroup", { name: "Rating" });
const star = (name: string) => screen.getByRole("radio", { name });
const filled = () => document.querySelectorAll(".rating__star--filled").length;

describe("React RatingGroup (styled)", () => {
  it("renders a radiogroup of stars named from the catalog", () => {
    render(<RatingGroup label="Rating" />);
    expect(within(group()).getAllByRole("radio")).toHaveLength(5);
    expect(star("1 star")).toBeInTheDocument();
    expect(star("3 stars")).toBeInTheDocument();
    expect(group()).toHaveAttribute("aria-orientation", "horizontal");
  });

  it("names the stars in the provider's language", () => {
    render(
      <LocaleProvider
        locale="it"
        messages={{ "rating.stars": { one: "{count} stella", other: "{count} stelle" } }}
      >
        <RatingGroup label="Rating" max={2} />
      </LocaleProvider>,
    );
    expect(star("1 stella")).toBeInTheDocument();
    expect(star("2 stelle")).toBeInTheDocument();
  });

  it("respects max, and redraws the stars when it changes after mount", () => {
    const { rerender } = render(<RatingGroup label="Rating" max={10} />);
    expect(within(group()).getAllByRole("radio")).toHaveLength(10);
    rerender(<RatingGroup label="Rating" max={3} />);
    expect(within(group()).getAllByRole("radio")).toHaveLength(3);
  });

  it("selects a rating on click and reports the number, once", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<RatingGroup label="Rating" onValueChange={onValueChange} />);
    await user.click(star("3 stars"));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(3);
    expect(star("3 stars")).toBeChecked();
    await user.unhover(group());
    expect(filled()).toBe(3);
  });

  it("moves the rating with the arrow keys", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<RatingGroup label="Rating" value={2} onValueChange={onValueChange} />);
    await user.tab();
    expect(star("2 stars")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenLastCalledWith(3);
  });

  it("previews the stars under the pointer, then shows the rating again", async () => {
    const user = userEvent.setup();
    render(<RatingGroup label="Rating" value={2} />);
    await user.hover(star("4 stars").closest("label")!);
    expect(document.querySelectorAll(".rating__star--preview")).toHaveLength(4);
    expect(filled()).toBe(0);
    await user.unhover(group());
    expect(filled()).toBe(2);
  });

  it("reflects a preselected value and mirrors a controlled one without reporting", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <RatingGroup label="Rating" value={4} onValueChange={onValueChange} />,
    );
    expect(star("4 stars")).toBeChecked();
    rerender(<RatingGroup label="Rating" value={1} onValueChange={onValueChange} />);
    expect(star("1 star")).toBeChecked();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("does not select when disabled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<RatingGroup label="Rating" disabled onValueChange={onValueChange} />);
    await user.click(star("3 stars"));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("submits the rating under the field name", async () => {
    const user = userEvent.setup();
    render(
      <form data-testid="form">
        <RatingGroup label="Rating" name="rating" />
      </form>,
    );
    await user.click(star("4 stars"));
    expect(new FormData(screen.getByTestId("form") as HTMLFormElement).get("rating")).toBe("4");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<RatingGroup label="Rating" value={3} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
