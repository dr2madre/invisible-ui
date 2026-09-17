import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./menu.fixture.svelte";

// Menu is the former name of Sidebar (ADR 0013). What it promised keeps
// working until the removal: the same props, the same slots, the landmark and
// its name, the current item, and the callback. Class names were never public
// surface, so they are not held here.
describe("Menu, the deprecated name of Sidebar", () => {
  it("renders the same labelled navigation landmark", () => {
    render(Fixture);
    expect(screen.getByRole("navigation")).toHaveAttribute("aria-label", "Main");
    expect(screen.getAllByRole("list")).toHaveLength(2);
  });

  it("marks the current destination with aria-current", () => {
    render(Fixture);
    const current = screen.getByRole("button", { name: "Home" });
    expect(current).toHaveAttribute("aria-current", "page");
  });

  it("reports onSelect when an item without an href is activated", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(Fixture, { props: { onSelect } });
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(onSelect).toHaveBeenCalledWith("search");
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("keeps rendering the logo and footer slots", () => {
    render(Fixture, { props: { withSlots: true } });
    expect(screen.getByText("Brand")).toBeInTheDocument();
    expect(screen.getByText("Signed in")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture);
    expect(await axe(container)).toHaveNoViolations();
  });
});
