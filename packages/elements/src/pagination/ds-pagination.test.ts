import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsPagination } from "./ds-pagination";

const mount = (attributes = 'page="4" page-count="10"') => {
  document.body.innerHTML = `<ds-pagination ${attributes}></ds-pagination>`;
  return document.querySelector("ds-pagination") as DsPagination;
};

describe("<ds-pagination>", () => {
  it("renders a named landmark, current page and bounded controls", () => {
    mount();
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to page 4" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Go to previous page" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Go to next page" })).toBeEnabled();
  });

  it("reports one user change after committing it and reflects props silently", async () => {
    const user = userEvent.setup();
    const host = mount();
    const seen: Array<{ detail: number; current: number }> = [];
    host.addEventListener("change", (event) => {
      seen.push({
        detail: (event as CustomEvent<{ page: number }>).detail.page,
        current: host.page,
      });
    });

    await user.click(screen.getByRole("button", { name: "Go to page 5" }));
    expect(seen).toEqual([{ detail: 5, current: 5 }]);
    expect(host).toHaveAttribute("page", "5");

    host.page = 2;
    expect(seen).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Go to page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("keeps focus while a user action changes the visible page window", async () => {
    const user = userEvent.setup();
    mount('page="5" page-count="20" sibling-count="1"');
    const pageSix = screen.getByRole("button", { name: "Go to page 6" });
    await user.click(pageSix);
    expect(pageSix).toHaveFocus();
    expect(pageSix).toHaveAttribute("aria-current", "page");
  });

  it("moves roving focus with arrows and skips disabled boundary controls", async () => {
    const user = userEvent.setup();
    mount('page="1" page-count="5"');
    const current = screen.getByRole("button", { name: "Go to page 1" });
    const nextPage = screen.getByRole("button", { name: "Go to page 2" });
    current.focus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("button", { name: "Go to next page" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(current).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(nextPage).toHaveFocus();
  });

  it("follows configuration changes, clamps silently and updates labels", () => {
    const host = mount('page="8" page-count="10"');
    const changes = vi.fn();
    host.addEventListener("change", changes);
    host.pageCount = 3;
    host.setAttribute("label", "Catalog pages");
    host.setAttribute("page-label", "Open page {page}");
    expect(host.page).toBe(3);
    expect(changes).not.toHaveBeenCalled();
    expect(screen.getByRole("navigation", { name: "Catalog pages" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open page 3" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("disables every action reactively", async () => {
    const user = userEvent.setup();
    const host = mount();
    const changes = vi.fn();
    host.addEventListener("change", changes);
    host.disabled = true;
    expect(screen.getAllByRole("button").every((button) => button.hasAttribute("disabled"))).toBe(
      true,
    );
    await user.click(screen.getByRole("button", { name: "Go to page 5" }));
    expect(changes).not.toHaveBeenCalled();
    expect(host.page).toBe(4);
  });

  it("has no accessibility violations", async () => {
    mount();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
