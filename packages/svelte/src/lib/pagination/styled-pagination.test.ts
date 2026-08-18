import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Pagination from "./Pagination.svelte";

describe("Svelte Pagination (styled)", () => {
  it("renders the current page selected and ellipsis for long ranges", () => {
    render(Pagination, { props: { page: 6, pageCount: 20 } });
    const current = screen.getByRole("button", { name: "Go to page 6" });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current).toHaveAttribute("data-selected", "");
    // Long range collapses to ellipsis gaps.
    expect(screen.queryByRole("button", { name: "Go to page 12" })).not.toBeInTheDocument();
  });

  it("reports page changes", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(Pagination, { props: { page: 1, pageCount: 5, onPageChange } });
    await user.click(screen.getByRole("button", { name: "Go to page 2" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Pagination, { props: { page: 3, pageCount: 10 } });
    expect(await axe(container)).toHaveNoViolations();
  });
});

// Task 5A: `page` is a controllable mirror, added so the table's pager can
// follow a controlled page without a remount. Only `page` gained this
// contract; the other props keep their initial-value behaviour.
describe("Svelte Pagination (controlled page)", () => {
  it("follows a later page prop without emitting onPageChange", async () => {
    const onPageChange = vi.fn();
    const { rerender } = render(Pagination, { props: { page: 2, pageCount: 5, onPageChange } });
    expect(screen.getByRole("button", { name: "Go to page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await rerender({ page: 4, pageCount: 5, onPageChange });
    expect(screen.getByRole("button", { name: "Go to page 4" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("clamps an out-of-range controlled page to the current bounds", async () => {
    const onPageChange = vi.fn();
    const { rerender } = render(Pagination, { props: { page: 2, pageCount: 5, onPageChange } });

    await rerender({ page: 9, pageCount: 5, onPageChange });
    expect(screen.getByRole("button", { name: "Go to page 5" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(onPageChange).not.toHaveBeenCalled();
  });
});
