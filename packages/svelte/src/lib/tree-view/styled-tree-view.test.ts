import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import Fixture from "./tree-view.fixture.svelte";

describe("Svelte TreeView (styled)", () => {
  it("is a labelled tree of treeitems", () => {
    render(Fixture);
    expect(screen.getByRole("tree", { name: "Project files" })).toBeInTheDocument();
    expect(screen.getByRole("treeitem", { name: /src/ })).toBeInTheDocument();
  });

  it("shows children of expanded parents and hides collapsed ones", () => {
    render(Fixture, { props: { expanded: ["src"] } });
    expect(screen.getByRole("treeitem", { name: /index\.ts/ })).toBeInTheDocument();
    // `lib` is collapsed, so its children are not rendered.
    expect(screen.queryByRole("treeitem", { name: /button\.ts/ })).not.toBeInTheDocument();
  });

  it("exposes expansion and depth metadata", () => {
    render(Fixture, { props: { expanded: ["src"] } });
    const src = screen.getByRole("treeitem", { name: /src/ });
    expect(src).toHaveAttribute("aria-expanded", "true");
    expect(src).toHaveAttribute("aria-level", "1");
    const index = screen.getByRole("treeitem", { name: /index\.ts/ });
    expect(index).toHaveAttribute("aria-level", "2");
    expect(index).not.toHaveAttribute("aria-expanded"); // leaf
  });

  it("toggles a subtree when the twistie is clicked", async () => {
    render(Fixture, { props: { expanded: ["src"] } });
    const lib = screen.getByRole("treeitem", { name: /lib/ });
    await fireEvent.click(lib.querySelector(".tree__twistie")!);
    expect(screen.getByRole("treeitem", { name: /button\.ts/ })).toBeInTheDocument();
  });

  it("selects a node on click (aria-selected)", async () => {
    render(Fixture, { props: { expanded: ["src"] } });
    const index = screen.getByRole("treeitem", { name: /index\.ts/ });
    await fireEvent.click(index);
    expect(index).toHaveAttribute("aria-selected", "true");
  });

  it("keeps a single roving tab stop", () => {
    render(Fixture, { props: { expanded: ["src"], selected: "index.ts" } });
    expect(screen.getByRole("treeitem", { name: /index\.ts/ })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("treeitem", { name: /src/ })).toHaveAttribute("tabindex", "-1");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { expanded: ["src", "lib"] } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
