import { render, screen } from "@testing-library/vue";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
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

  it("has no accessibility violations", async () => {
    const { container } = setup({ expanded: ["src", "lib"] });
    expect(await axe(container, noAxeColorContrast)).toHaveNoViolations();
  });
});
