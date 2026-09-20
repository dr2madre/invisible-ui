import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { axe } from "vitest-axe";
import { SearchField } from "./SearchField";

describe("Vue SearchField", () => {
  it("renders a named search input and native submit action", () => {
    render(SearchField, { props: { label: "Search tables" } });
    expect(screen.getByRole("searchbox", { name: "Search tables" })).toHaveAttribute(
      "type",
      "search",
    );
    expect(screen.getByRole("button", { name: "Search" })).toHaveAttribute("type", "submit");
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
  });

  it("clears once and returns focus to the input", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(SearchField, { props: { label: "Search tables", value: "archive", onValueChange } });
    const input = screen.getByRole("searchbox", { name: "Search tables" });

    await user.click(screen.getByRole("button", { name: "Clear search" }));

    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("");
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
  });

  it("has no accessibility violations with its label hidden", async () => {
    const { container } = render(SearchField, {
      props: { label: "Search tables", hideLabel: true, value: "archive" },
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
