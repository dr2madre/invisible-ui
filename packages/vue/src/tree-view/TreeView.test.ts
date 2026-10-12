import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { defineComponent, h } from "vue";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { TreeView } from "./TreeView";
import type { TreeNode } from "./use-tree-view";

const noAxeColorContrast = { rules: { "color-contrast": { enabled: false } } };

const nodes: TreeNode[] = [
  {
    value: "src",
    children: [
      { value: "index.ts" },
      { value: "lib", children: [{ value: "button.ts" }, { value: "input.ts" }] },
    ],
  },
  { value: "readme", disabled: true },
  { value: "package.json" },
];

const setup = (props: Record<string, unknown> = {}) =>
  render(TreeView, { props: { nodes, label: "Project files", expanded: ["src"], ...props } });

describe("Vue TreeView", () => {
  it("is a labelled tree of treeitems", () => {
    setup();
    expect(screen.getByRole("tree", { name: "Project files" })).toBeInTheDocument();
    expect(screen.getByRole("treeitem", { name: /src/ })).toBeInTheDocument();
  });

  it("shows children of expanded parents and hides collapsed ones", () => {
    setup();
    expect(screen.getByRole("treeitem", { name: /index\.ts/ })).toBeInTheDocument();
    // `lib` is collapsed, so its children are not rendered.
    expect(screen.queryByRole("treeitem", { name: /button\.ts/ })).not.toBeInTheDocument();
  });

  it("exposes expansion and depth metadata", () => {
    setup();
    const src = screen.getByRole("treeitem", { name: /src/ });
    expect(src).toHaveAttribute("aria-expanded", "true");
    expect(src).toHaveAttribute("aria-level", "1");
    const index = screen.getByRole("treeitem", { name: /index\.ts/ });
    expect(index).toHaveAttribute("aria-level", "2");
    expect(index).not.toHaveAttribute("aria-expanded"); // leaf
  });

  it("toggles a subtree when the twistie is clicked", async () => {
    const user = userEvent.setup();
    setup();
    const lib = screen.getByRole("treeitem", { name: /lib/ });
    await user.click(lib.querySelector(".tree__twistie")!);
    expect(screen.getByRole("treeitem", { name: /button\.ts/ })).toBeInTheDocument();
  });

  it("selects a node on click (aria-selected)", async () => {
    const user = userEvent.setup();
    setup();
    const index = screen.getByRole("treeitem", { name: /index\.ts/ });
    await user.click(index);
    expect(index).toHaveAttribute("aria-selected", "true");
  });

  it("keeps a single roving tab stop", () => {
    setup({ selected: "index.ts" });
    expect(screen.getByRole("treeitem", { name: /index\.ts/ })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("treeitem", { name: /src/ })).toHaveAttribute("tabindex", "-1");
  });

  it("moves focus with the arrow keys over the visible rows", async () => {
    const user = userEvent.setup();
    setup();
    const src = screen.getByRole("treeitem", { name: /src/ });
    src.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("treeitem", { name: /index\.ts/ })).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(src).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("treeitem", { name: /package\.json/ })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(src).toHaveFocus();
  });

  it("collapses with ArrowLeft and expands with ArrowRight", async () => {
    const user = userEvent.setup();
    setup();
    const src = screen.getByRole("treeitem", { name: /src/ });
    src.focus();
    await user.keyboard("{ArrowLeft}");
    expect(src).toHaveAttribute("aria-expanded", "false");
    await user.keyboard("{ArrowRight}");
    expect(src).toHaveAttribute("aria-expanded", "true");
  });

  it("reports selection through v-model", async () => {
    const user = userEvent.setup();
    const { emitted } = setup();
    await user.click(screen.getByRole("treeitem", { name: /index\.ts/ }));
    expect(emitted()["update:selected"]).toEqual([["index.ts"]]);
  });

  it("requests unloaded children once and announces loading", async () => {
    const user = userEvent.setup();
    const onLoadChildren = vi.fn();
    setup({ nodes: [{ value: "remote", hasChildren: true }], expanded: [], onLoadChildren });
    const remote = screen.getByRole("treeitem", { name: /remote/ });
    await user.click(remote.querySelector(".tree__twistie")!);
    expect(onLoadChildren).toHaveBeenCalledOnce();
    expect(onLoadChildren.mock.calls[0]?.[0]).toMatchObject({ value: "remote" });
    expect(screen.getByRole("treeitem", { name: /remote/ })).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("treeitem", { name: "remote" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Loading remote");
    screen.getByRole("treeitem", { name: "remote" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(onLoadChildren).toHaveBeenCalledOnce();
  });

  it("retries a failed load with a newer request id", async () => {
    const user = userEvent.setup();
    const onLoadChildren = vi.fn();
    const { rerender } = setup({
      nodes: [{ value: "remote", hasChildren: true }],
      expanded: ["remote"],
      loadErrors: ["remote"],
      onLoadChildren,
    });
    const remote = screen.getByRole("treeitem", { name: /remote/ });
    remote.focus();
    expect(screen.getByRole("status")).toHaveTextContent("Press Right Arrow to retry");
    await user.keyboard("{ArrowRight}");
    const firstId = onLoadChildren.mock.calls[0]![0].requestId;

    await rerender({
      nodes: [{ value: "remote", hasChildren: true }],
      label: "Project files",
      expanded: ["remote"],
      loading: [],
      loadErrors: ["remote"],
      onLoadChildren,
    });
    screen.getByRole("treeitem", { name: /remote/ }).focus();
    await user.keyboard("{ArrowRight}");
    expect(onLoadChildren.mock.calls[1]![0].requestId).toBeGreaterThan(firstId);
  });

  it("collapses and expands a failed row with the twistie instead of retrying", async () => {
    const user = userEvent.setup();
    const onLoadChildren = vi.fn();
    setup({
      nodes: [{ value: "remote", hasChildren: true }],
      expanded: ["remote"],
      loadErrors: ["remote"],
      onLoadChildren,
    });
    const twistie = () =>
      screen.getByRole("treeitem", { name: /remote/ }).querySelector(".tree__twistie")!;

    await user.click(twistie());
    expect(screen.getByRole("treeitem", { name: /remote/ })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(onLoadChildren).not.toHaveBeenCalled();

    await user.click(twistie());
    expect(screen.getByRole("treeitem", { name: /remote/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("mirrors Left and Right in right-to-left text", async () => {
    const user = userEvent.setup();
    render(
      defineComponent({
        setup: () => () =>
          h("div", { dir: "rtl" }, [h(TreeView, { nodes, label: "Project files", expanded: [] })]),
      }),
    );
    const src = screen.getByRole("treeitem", { name: /src/ });
    src.focus();
    await user.keyboard("{ArrowLeft}");
    expect(src).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{ArrowRight}");
    expect(src).toHaveAttribute("aria-expanded", "false");
  });

  it("moves focus by typeahead, by one character and by a quick sequence", async () => {
    vi.useFakeTimers();
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      setup({
        nodes: [{ value: "a" }, { value: "b" }, { value: "c" }, { value: "d" }],
        labels: { a: "Apple", b: "Banana", c: "Blueberry", d: "Cherry" },
        expanded: [],
        selected: "a",
      });
      const row = (name: string) => screen.getByRole("treeitem", { name });
      row("Apple").focus();

      await user.keyboard("c");
      expect(row("Cherry")).toHaveFocus();
      vi.advanceTimersByTime(600);

      await user.keyboard("bl");
      expect(row("Blueberry")).toHaveFocus();
      expect(row("Apple")).toHaveAttribute("aria-selected", "true");
      expect(row("Blueberry")).toHaveAttribute("aria-selected", "false");
    } finally {
      vi.useRealTimers();
    }
  });

  it("matches the text the label slot shows", async () => {
    const user = userEvent.setup();
    render(TreeView, {
      props: { nodes: [{ value: "x1" }, { value: "x2" }], label: "Files" },
      slots: {
        label: ({ node }: { node: { value: string } }) => (node.value === "x2" ? "Zeta" : "Alpha"),
      },
    });
    screen.getByRole("treeitem", { name: "Alpha" }).focus();
    await user.keyboard("z");
    expect(screen.getByRole("treeitem", { name: "Zeta" })).toHaveFocus();
  });

  it("keeps focus when loaded children replace the controlled forest", async () => {
    const { rerender } = setup({
      nodes: [{ value: "remote", hasChildren: true }],
      expanded: ["remote"],
      loading: ["remote"],
    });
    screen.getByRole("treeitem", { name: /remote/ }).focus();
    await rerender({
      nodes: [{ value: "remote", children: [{ value: "child" }] }],
      label: "Project files",
      expanded: ["remote"],
      loading: [],
      loadErrors: [],
    });
    expect(screen.getByRole("treeitem", { name: /remote/ })).toHaveFocus();
    expect(screen.getByRole("treeitem", { name: /child/ })).toBeInTheDocument();
  });

  it("allows independent branches to load concurrently", async () => {
    const user = userEvent.setup();
    const onLoadChildren = vi.fn();
    setup({
      nodes: [
        { value: "one", hasChildren: true },
        { value: "two", hasChildren: true },
      ],
      expanded: [],
      onLoadChildren,
    });
    await user.click(screen.getByRole("treeitem", { name: /one/ }).querySelector("button")!);
    await user.click(screen.getByRole("treeitem", { name: /two/ }).querySelector("button")!);
    expect(onLoadChildren.mock.calls.map(([request]) => request.value)).toEqual(["one", "two"]);
  });

  it("has no accessibility violations", async () => {
    const { container } = setup({ expanded: ["src", "lib"] });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
