import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./rating-group.fixture.svelte";

const group = () => screen.getByRole("radiogroup", { name: "Rating" });

describe("Svelte RatingGroup (styled)", () => {
  it("renders a radiogroup of labelled stars", () => {
    render(Fixture);
    const stars = within(group()).getAllByRole("radio");
    expect(stars).toHaveLength(5);
    expect(within(group()).getByRole("radio", { name: "1 star" })).toBeInTheDocument();
    expect(within(group()).getByRole("radio", { name: "3 stars" })).toBeInTheDocument();
  });

  it("respects max", () => {
    render(Fixture, { props: { max: 10 } });
    expect(within(group()).getAllByRole("radio")).toHaveLength(10);
  });

  it("selects a rating on click and reports the number", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Fixture, { props: { onValueChange } });

    await user.click(screen.getByRole("radio", { name: "3 stars" }));
    expect(onValueChange).toHaveBeenLastCalledWith(3);
    expect(screen.getByRole("radio", { name: "3 stars" })).toBeChecked();
  });

  it("reflects a preselected value", () => {
    render(Fixture, { props: { value: 4 } });
    expect(screen.getByRole("radio", { name: "4 stars" })).toBeChecked();
  });

  it("does not select when disabled", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(Fixture, { props: { disabled: true, onValueChange } });

    await user.click(screen.getByRole("radio", { name: "3 stars" }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { value: 3 } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
