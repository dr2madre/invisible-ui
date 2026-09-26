import { screen, within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach } from "vitest";
import { axe } from "vitest-axe";
import "../define";
import type { DsTableView } from "./ds-table-view";
import { listen, peopleColumns, peopleRows } from "./table-set.fixture";

afterEach(() => {
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

const mount = (attributes: Record<string, string> = {}) => {
  const view = document.createElement("ds-table-view") as DsTableView;
  for (const [name, value] of Object.entries({ caption: "People", ...attributes }))
    view.setAttribute(name, value);
  view.columns = peopleColumns;
  view.rows = peopleRows;
  document.body.appendChild(view);
  return view;
};

describe("<ds-table-view>", () => {
  it("renders one view on its own, sorted by default", () => {
    const view = mount();
    expect(within(view).getByRole("table", { name: "People" })).toBeInTheDocument();
    expect(view.sort).toEqual({ key: "name", direction: "asc" });
    expect(view.querySelector(".table-view")).toHaveAttribute("tabindex", "-1");
  });

  it("puts a title beside the controls and hides the caption it repeats", () => {
    const view = mount({ title: "People", "title-level": "3", configurable: "" });
    const heading = screen.getByRole("heading", { level: 3, name: "People" });
    expect(heading.closest(".table-view__header")).toContainElement(
      screen.getByRole("button", { name: "Columns" }),
    );
    expect(view.querySelector("caption")).toHaveClass("table__caption--hidden");
  });

  it("emits its events from itself and reflects the current page", async () => {
    const user = userEvent.setup();
    const view = mount({ "page-size": "2" });
    const onPageChange = listen(view, "page-change");
    await user.click(screen.getByRole("button", { name: "Go to page 3" }));
    expect(onPageChange).toHaveBeenCalledWith({ page: 3 });
    expect(view.page).toBe(3);
    expect(view.getAttribute("page")).toBeNull();
  });

  it("loads more when the sentinel comes into view", () => {
    let notify: (entries: { isIntersecting: boolean }[]) => void = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: typeof notify) {
          notify = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    const view = mount({ infinite: "", "has-more": "" });
    const onLoadMore = listen(view, "load-more");
    notify([{ isIntersecting: true }]);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    view.setAttribute("loading", "");
    notify([{ isIntersecting: true }]);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("uses the labels it is given", async () => {
    const user = userEvent.setup();
    mount({
      "page-size": "2",
      "pagination-label": "People pages",
      configurable: "",
      "config-label": "Visible columns",
    });
    expect(screen.getByRole("navigation", { name: "People pages" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Visible columns" }));
    expect(screen.getByRole("group", { name: "Visible columns" })).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    mount({ title: "People", "allow-view-toggle": "", configurable: "", "page-size": "2" });
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
