import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
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

  it("requests unloaded children once and announces loading", async () => {
    const onLoadChildren = vi.fn();
    render(Fixture, {
      props: {
        nodes: [{ value: "remote", hasChildren: true }],
        expanded: [],
        onLoadChildren,
      },
    });
    const remote = screen.getByRole("treeitem", { name: /remote/ });
    await fireEvent.click(remote.querySelector(".tree__twistie")!);
    expect(onLoadChildren).toHaveBeenCalledOnce();
    expect(onLoadChildren.mock.calls[0]?.[0]).toMatchObject({ value: "remote" });
    expect(screen.getByRole("treeitem", { name: /remote/ })).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("treeitem", { name: "remote" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Loading remote");
    screen.getByRole("treeitem", { name: "remote" }).focus();
    await fireEvent.keyDown(screen.getByRole("treeitem", { name: "remote" }), {
      key: "ArrowRight",
    });
    expect(onLoadChildren).toHaveBeenCalledOnce();
  });

  it("retries a failed load and gives the retry a newer request id", async () => {
    const onLoadChildren = vi.fn();
    const { rerender } = render(Fixture, {
      props: {
        nodes: [{ value: "remote", hasChildren: true }],
        expanded: ["remote"],
        loadErrors: ["remote"],
        onLoadChildren,
      },
    });
    const remote = screen.getByRole("treeitem", { name: /remote/ });
    expect(screen.getByRole("status")).toHaveTextContent("Press Right Arrow to retry");
    await fireEvent.keyDown(remote, { key: "ArrowRight" });
    const firstId = onLoadChildren.mock.calls[0]![0].requestId;
    expect(screen.getByRole("treeitem", { name: /remote/ })).toHaveAttribute("aria-busy", "true");

    await rerender({
      nodes: [{ value: "remote", hasChildren: true }],
      expanded: ["remote"],
      loading: [],
      loadErrors: ["remote"],
      onLoadChildren,
    });
    await fireEvent.click(
      screen.getByRole("treeitem", { name: /remote/ }).querySelector(".tree__twistie")!,
    );
    expect(onLoadChildren.mock.calls[1]![0].requestId).toBeGreaterThan(firstId);
  });

  it("keeps focus when loaded children replace the controlled forest", async () => {
    const { rerender } = render(Fixture, {
      props: {
        nodes: [{ value: "remote", hasChildren: true }],
        expanded: ["remote"],
        loading: ["remote"],
      },
    });
    screen.getByRole("treeitem", { name: /remote/ }).focus();
    await rerender({
      nodes: [{ value: "remote", children: [{ value: "child" }] }],
      expanded: ["remote"],
      loading: [],
      loadErrors: [],
    });
    expect(screen.getByRole("treeitem", { name: /remote/ })).toHaveFocus();
    expect(screen.getByRole("treeitem", { name: /child/ })).toBeInTheDocument();
  });

  it("allows independent branches to load concurrently", async () => {
    const onLoadChildren = vi.fn();
    render(Fixture, {
      props: {
        nodes: [
          { value: "one", hasChildren: true },
          { value: "two", hasChildren: true },
        ],
        expanded: [],
        onLoadChildren,
      },
    });
    await fireEvent.click(
      screen.getByRole("treeitem", { name: /one/ }).querySelector(".tree__twistie")!,
    );
    await fireEvent.click(
      screen.getByRole("treeitem", { name: /two/ }).querySelector(".tree__twistie")!,
    );
    expect(onLoadChildren.mock.calls.map(([request]) => request.value)).toEqual(["one", "two"]);
  });

  it("has no accessibility violations", async () => {
    const { container } = render(Fixture, { props: { expanded: ["src", "lib"] } });
    expect(await axe(container)).toHaveNoViolations();
  });
});
