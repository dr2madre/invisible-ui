import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Count } from "../count/Count";
import { LocaleProvider } from "../i18n/i18n";
import { Tag } from "./Tag";

describe("React Tag", () => {
  it("renders its text and reflects the status, variant and size", () => {
    render(
      <Tag status="success" variant="solid" size="sm">
        Done
      </Tag>,
    );
    const tag = document.querySelector(".tag")!;
    expect(tag).toHaveAttribute("data-status", "success");
    expect(tag).toHaveAttribute("data-variant", "solid");
    expect(tag).toHaveAttribute("data-size", "sm");
    expect(tag.querySelector(".tag__label")).toHaveTextContent("Done");
  });

  it("is not removable by default", () => {
    render(<Tag>Draft</Tag>);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders a named remove button and calls onRemove when removable", async () => {
    const onRemove = vi.fn();
    render(
      <Tag removable onRemove={onRemove}>
        Draft
      </Tag>,
    );
    const button = screen.getByRole("button", { name: "Remove" });
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    await userEvent.click(button);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("names the remove button from the catalog, or from removeLabel", () => {
    const { unmount } = render(
      <LocaleProvider locale="it" messages={{ "tag.remove": "Rimuovi" }}>
        <Tag removable>Bozza</Tag>
      </LocaleProvider>,
    );
    expect(screen.getByRole("button", { name: "Rimuovi" })).toBeInTheDocument();
    unmount();
    render(
      <Tag removable removeLabel="Remove Draft">
        Draft
      </Tag>,
    );
    expect(screen.getByRole("button", { name: "Remove Draft" })).toBeInTheDocument();
  });

  it("hides the icon and can hold a Count at the end", () => {
    render(
      <Tag icon={<svg />} trailing={<Count count={3} />}>
        Inbox
      </Tag>,
    );
    expect(document.querySelector(".tag__icon")).toHaveAttribute("aria-hidden", "true");
    expect(document.querySelector(".tag__trailing .count")).toHaveTextContent("3");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(
      <Tag removable status="danger">
        Blocked
      </Tag>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
