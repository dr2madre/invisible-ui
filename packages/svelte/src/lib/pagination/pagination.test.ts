import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./pagination.fixture.svelte";

describe("Svelte Pagination", () => {
  it("marks the current page with aria-current in a labelled nav", () => {
    render(Fixture, { props: { page: 2, pageCount: 5 } });
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Go to page 1" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("changes page on click and reports it", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(Fixture, { props: { page: 1, pageCount: 5, onPageChange } });
    await user.click(screen.getByRole("button", { name: "Go to page 3" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("disables previous on the first page", () => {
    render(Fixture, { props: { page: 1, pageCount: 5 } });
    expect(screen.getByRole("button", { name: "Go to previous page" })).toBeDisabled();
  });

  it("advances with the next button", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(Fixture, { props: { page: 2, pageCount: 5, onPageChange } });
    await user.click(screen.getByRole("button", { name: "Go to next page" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("moves focus across pages with arrow keys", async () => {
    const user = userEvent.setup();
    render(Fixture, { props: { page: 2, pageCount: 5 } });
    const current = screen.getByRole("button", { name: "Go to page 2" });
    current.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Go to page 3" })).toHaveFocus();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { page: 3, pageCount: 10 } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
