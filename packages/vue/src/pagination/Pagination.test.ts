import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Pagination } from "./Pagination";

describe("Vue Pagination (styled)", () => {
  it("marks the current page with aria-current in a labelled nav", () => {
    render(Pagination, { props: { page: 2, pageCount: 5 } });
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
    const current = screen.getByRole("button", { name: "Go to page 2" });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current).toHaveAttribute("data-selected", "");
    expect(screen.getByRole("button", { name: "Go to page 1" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("changes page on click and reports it", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(Pagination, { props: { page: 1, pageCount: 5, onPageChange } });
    await user.click(screen.getByRole("button", { name: "Go to page 3" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("disables previous on the first page", () => {
    render(Pagination, { props: { page: 1, pageCount: 5 } });
    expect(screen.getByRole("button", { name: "Go to previous page" })).toBeDisabled();
  });

  it("advances with the next button", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(Pagination, { props: { page: 2, pageCount: 5, onPageChange } });
    await user.click(screen.getByRole("button", { name: "Go to next page" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("moves focus across pages with arrow keys", async () => {
    const user = userEvent.setup();
    render(Pagination, { props: { page: 2, pageCount: 5 } });
    const current = screen.getByRole("button", { name: "Go to page 2" });
    current.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Go to page 3" })).toHaveFocus();
  });

  it("collapses long ranges into ellipsis gaps", () => {
    render(Pagination, { props: { page: 6, pageCount: 20 } });
    expect(screen.getByRole("button", { name: "Go to page 6" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.queryByRole("button", { name: "Go to page 12" })).not.toBeInTheDocument();
  });

  it("supports v-model: emits update:modelValue on page change", async () => {
    const user = userEvent.setup();
    const { emitted } = render(Pagination, { props: { modelValue: 1, pageCount: 5 } });
    await user.click(screen.getByRole("button", { name: "Go to page 2" }));
    expect(emitted("update:modelValue")).toEqual([[2]]);
  });

  it("mirrors an externally controlled page", async () => {
    const { rerender } = render(Pagination, { props: { page: 1, pageCount: 5 } });
    await rerender({ page: 4 });
    expect(screen.getByRole("button", { name: "Go to page 4" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Pagination, { props: { page: 3, pageCount: 10 } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
