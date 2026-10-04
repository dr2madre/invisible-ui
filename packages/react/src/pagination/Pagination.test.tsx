import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { LocaleProvider } from "../i18n/i18n";
import { Pagination } from "./Pagination";

const page = (n: number) => screen.getByRole("button", { name: `Go to page ${n}` });

describe("React Pagination", () => {
  it("marks the current page with aria-current in a labelled nav", () => {
    render(<Pagination page={2} pageCount={5} />);
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
    expect(page(2)).toHaveAttribute("aria-current", "page");
    expect(page(2)).toHaveAttribute("data-selected", "");
    expect(page(1)).not.toHaveAttribute("aria-current");
  });

  it("collapses a long range into ellipsis gaps", () => {
    render(<Pagination page={6} pageCount={20} />);
    expect(screen.queryByRole("button", { name: "Go to page 12" })).not.toBeInTheDocument();
    expect(document.querySelectorAll(".pagination__ellipsis")).toHaveLength(2);
  });

  it("names every control from the catalog, in the provider's language", () => {
    render(
      <LocaleProvider
        locale="it"
        messages={{
          "pagination.label": "Paginazione",
          "pagination.previous": "Pagina precedente",
          "pagination.next": "Pagina successiva",
          "pagination.page": "Vai a pagina {page}",
        }}
      >
        <Pagination page={1} pageCount={3} />
      </LocaleProvider>,
    );
    expect(screen.getByRole("navigation", { name: "Paginazione" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pagina precedente" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Pagina successiva" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Vai a pagina 3" })).toBeInTheDocument();
  });

  it("changes page on click and reports it once", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={1} pageCount={5} onPageChange={onPageChange} />);
    await user.click(page(3));
    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith(3);
    expect(page(3)).toHaveAttribute("aria-current", "page");
  });

  it("disables previous on the first page and advances with next", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={2} pageCount={5} onPageChange={onPageChange} />);
    await user.click(screen.getByRole("button", { name: "Go to next page" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("moves focus to the current page when Next or Previous turns disabled", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Pagination page={4} pageCount={5} />);
    await user.click(screen.getByRole("button", { name: "Go to next page" }));
    expect(screen.getByRole("button", { name: "Go to next page" })).toBeDisabled();
    expect(page(5)).toHaveFocus();
    unmount();

    render(<Pagination page={2} pageCount={5} />);
    await user.click(screen.getByRole("button", { name: "Go to previous page" }));
    expect(screen.getByRole("button", { name: "Go to previous page" })).toBeDisabled();
    expect(page(1)).toHaveFocus();
  });

  it("moves focus across the controls with the arrow keys, Home and End", async () => {
    const user = userEvent.setup();
    render(<Pagination page={2} pageCount={5} />);
    expect(page(2)).toHaveAttribute("tabindex", "0");
    page(2).focus();
    await user.keyboard("{ArrowRight}");
    expect(page(3)).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("button", { name: "Go to next page" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("button", { name: "Go to previous page" })).toHaveFocus();
  });

  it("follows the visual direction in right-to-left text", async () => {
    const user = userEvent.setup();
    render(
      <div dir="rtl">
        <Pagination page={1} pageCount={5} />
      </div>,
    );
    page(1).focus();
    // The visual start is on the right, so ArrowLeft walks forward.
    await user.keyboard("{ArrowLeft}");
    expect(page(2)).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(page(1)).toHaveFocus();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Pagination page={3} pageCount={10} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("React Pagination (controlled page)", () => {
  it("follows a later page prop without reporting it", () => {
    const onPageChange = vi.fn();
    const { rerender } = render(<Pagination page={2} pageCount={5} onPageChange={onPageChange} />);
    rerender(<Pagination page={4} pageCount={5} onPageChange={onPageChange} />);
    expect(page(4)).toHaveAttribute("aria-current", "page");
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("calls only the replacement callback after it is swapped", async () => {
    const user = userEvent.setup();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<Pagination page={1} pageCount={5} onPageChange={first} />);
    rerender(<Pagination page={1} pageCount={5} onPageChange={second} />);
    await user.click(page(3));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith(3);
  });

  it("re-clamps silently when the count shrinks", () => {
    const onPageChange = vi.fn();
    const { rerender } = render(<Pagination page={8} pageCount={10} onPageChange={onPageChange} />);
    rerender(<Pagination page={8} pageCount={4} onPageChange={onPageChange} />);
    expect(page(4)).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("button", { name: "Go to page 8" })).not.toBeInTheDocument();
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("follows a later disabled prop", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const { rerender } = render(
      <Pagination page={2} pageCount={5} disabled onPageChange={onPageChange} />,
    );
    for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
    rerender(<Pagination page={2} pageCount={5} onPageChange={onPageChange} />);
    await user.click(page(3));
    expect(onPageChange).toHaveBeenCalledTimes(1);
  });

  it("clamps an out-of-range controlled page to the current bounds", () => {
    const onPageChange = vi.fn();
    const { rerender } = render(<Pagination page={2} pageCount={5} onPageChange={onPageChange} />);
    rerender(<Pagination page={9} pageCount={5} onPageChange={onPageChange} />);
    expect(page(5)).toHaveAttribute("aria-current", "page");
    expect(onPageChange).not.toHaveBeenCalled();
  });
});
