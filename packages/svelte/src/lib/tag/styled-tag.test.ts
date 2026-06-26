import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./tag.fixture.svelte";

const tag = () => document.querySelector<HTMLElement>(".tag")!;

describe("Svelte Tag (styled)", () => {
  it("renders its text and reflects status/variant", () => {
    render(Fixture, { props: { status: "success", variant: "solid" } });
    expect(screen.getByText("In review")).toBeInTheDocument();
    expect(tag()).toHaveAttribute("data-status", "success");
    expect(tag()).toHaveAttribute("data-variant", "solid");
  });

  it("is not removable by default", () => {
    render(Fixture);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a labelled remove button and fires onRemove when removable", async () => {
    const onRemove = vi.fn();
    render(Fixture, { props: { removable: true, removeLabel: "Remove review tag", onRemove } });
    const button = screen.getByRole("button", { name: "Remove review tag" });
    await fireEvent.click(button);
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("can host a Count in the trailing slot", () => {
    render(Fixture, { props: { withCount: true } });
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, {
      props: { removable: true, removeLabel: "Remove tag" },
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});
