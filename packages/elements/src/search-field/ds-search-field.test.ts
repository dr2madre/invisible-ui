import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import "../define";
import type { DsSearchField } from "./ds-search-field";

const mount = (attributes = "") => {
  document.body.innerHTML = `<form><ds-search-field label="Search tables" ${attributes}></ds-search-field></form>`;
  return document.querySelector("ds-search-field") as DsSearchField;
};

describe("<ds-search-field>", () => {
  it("renders a named search input and native submit action", () => {
    mount();
    expect(screen.getByRole("searchbox", { name: "Search tables" })).toHaveAttribute(
      "type",
      "search",
    );
    expect(screen.getByRole("button", { name: "Search" })).toHaveAttribute("type", "submit");
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
  });

  it("clears once and returns focus to the input", async () => {
    const user = userEvent.setup();
    const host = mount('value="archive"');
    const seen: string[] = [];
    host.addEventListener("input", (event) => seen.push((event as CustomEvent).detail.value));
    const input = screen.getByRole("searchbox", { name: "Search tables" });

    await user.click(screen.getByRole("button", { name: "Clear search" }));

    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
    expect(seen).toEqual([""]);
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
  });

  it("keeps the label as the accessible name when hidden", async () => {
    mount('hide-label value="archive"');
    const input = screen.getByRole("searchbox", { name: "Search tables" });
    expect(input).toHaveAccessibleName("Search tables");
    expect(document.querySelector(".search-field__label")).toHaveClass(
      "search-field__label--hidden",
    );
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
