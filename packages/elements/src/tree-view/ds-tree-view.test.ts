import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, vi } from "vitest";
import { axe } from "vitest-axe";
import "../define";
import type { DsTreeView, TreeNode } from "./ds-tree-view";

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

afterEach(() => {
  document.body.innerHTML = "";
});

const mount = () => {
  const tree = document.createElement("ds-tree-view") as DsTreeView;
  tree.setAttribute("label", "Project files");
  tree.nodes = nodes;
  tree.expanded = ["src"];
  document.body.appendChild(tree);
  return tree;
};

describe("<ds-tree-view>", () => {
  it("renders a labelled flat tree with positional metadata", () => {
    mount();
    expect(screen.getByRole("tree", { name: "Project files" })).toBeInTheDocument();
    const src = screen.getByRole("treeitem", { name: /src/ });
    expect(src).toHaveAttribute("aria-expanded", "true");
    expect(src).toHaveAttribute("aria-level", "1");
    expect(screen.getByRole("treeitem", { name: /index\.ts/ })).toHaveAttribute("aria-level", "2");
    expect(screen.queryByRole("treeitem", { name: /button\.ts/ })).not.toBeInTheDocument();
  });

  it("reports expansion and selection once per user action", async () => {
    const user = userEvent.setup();
    const tree = mount();
    const expanded = vi.fn();
    const selected = vi.fn();
    tree.addEventListener("expanded-change", expanded);
    tree.addEventListener("selected-change", selected);
    await user.click(screen.getByRole("treeitem", { name: /lib/ }).querySelector("button")!);
    expect(expanded).toHaveBeenCalledOnce();
    expect(selected).not.toHaveBeenCalled();
    expect(tree.expanded).toEqual(["src", "lib"]);
    await user.click(screen.getByRole("treeitem", { name: /button\.ts/ }));
    expect(selected).toHaveBeenCalledOnce();
    expect(tree.selected).toBe("button.ts");
  });

  it("moves one roving tab stop through visible enabled rows", async () => {
    const user = userEvent.setup();
    mount();
    const src = screen.getByRole("treeitem", { name: /src/ });
    src.focus();
    await user.keyboard("{ArrowDown}");
    const index = screen.getByRole("treeitem", { name: /index\.ts/ });
    expect(index).toHaveFocus();
    await user.keyboard(" ");
    expect(screen.getByRole("treeitem", { name: /index\.ts/ })).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("treeitem", { name: /src/ })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("treeitem", { name: /package\.json/ })).toHaveFocus();
    expect(document.querySelectorAll('[role="treeitem"][tabindex="0"]')).toHaveLength(1);
  });

  it("reflects controlled properties without emitting", () => {
    const tree = mount();
    const expanded = vi.fn();
    const selected = vi.fn();
    tree.addEventListener("expanded-change", expanded);
    tree.addEventListener("selected-change", selected);
    tree.expanded = ["src", "lib"];
    tree.selected = "input.ts";
    tree.labels = { "input.ts": "Input module" };
    expect(screen.getByRole("treeitem", { name: /Input module/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(expanded).not.toHaveBeenCalled();
    expect(selected).not.toHaveBeenCalled();
  });

  it("supports consumer-controlled search or paging through node replacement", () => {
    const tree = mount();
    tree.selected = "package.json";
    tree.nodes = [{ value: "package.json" }];
    expect(screen.getAllByRole("treeitem")).toHaveLength(1);
    expect(screen.getByRole("treeitem", { name: /package\.json/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("requests unloaded children once and announces loading", async () => {
    const user = userEvent.setup();
    const tree = mount();
    tree.nodes = [{ value: "remote", hasChildren: true }];
    tree.expanded = [];
    const requested = vi.fn();
    tree.addEventListener("load-children", requested);
    const remote = screen.getByRole("treeitem", { name: /remote/ });
    await user.click(remote.querySelector(".tree__twistie")!);
    expect(requested).toHaveBeenCalledOnce();
    expect((requested.mock.calls[0]![0] as CustomEvent).detail).toMatchObject({
      value: "remote",
    });
    expect(tree.loading).toEqual(["remote"]);
    expect(screen.getByRole("treeitem", { name: /remote/ })).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("treeitem", { name: "remote" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Loading remote");

    screen.getByRole("treeitem", { name: "remote" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(requested).toHaveBeenCalledOnce();
  });

  it("retries a failed load with a newer request id", async () => {
    const user = userEvent.setup();
    const tree = mount();
    tree.nodes = [{ value: "remote", hasChildren: true }];
    tree.expanded = ["remote"];
    tree.loading = [];
    tree.loadErrors = ["remote"];
    const requested = vi.fn();
    tree.addEventListener("load-children", requested);
    const remote = screen.getByRole("treeitem", { name: /remote/ });
    remote.focus();
    expect(screen.getByRole("status")).toHaveTextContent("Press Right Arrow to retry");
    await user.keyboard("{ArrowRight}");
    const firstId = (requested.mock.calls[0]![0] as CustomEvent).detail.requestId;

    tree.loading = [];
    tree.loadErrors = ["remote"];
    await user.click(
      screen.getByRole("treeitem", { name: /remote/ }).querySelector(".tree__twistie")!,
    );
    expect((requested.mock.calls[1]![0] as CustomEvent).detail.requestId).toBeGreaterThan(firstId);
  });

  it("keeps focus when loaded children replace the controlled forest", () => {
    const tree = mount();
    tree.nodes = [{ value: "remote", hasChildren: true }];
    tree.expanded = ["remote"];
    tree.loading = ["remote"];
    screen.getByRole("treeitem", { name: /remote/ }).focus();
    tree.nodes = [{ value: "remote", children: [{ value: "child" }] }];
    tree.loading = [];
    expect(screen.getByRole("treeitem", { name: /remote/ })).toHaveFocus();
    expect(screen.getByRole("treeitem", { name: /child/ })).toBeInTheDocument();
  });

  it("supports concurrent branch requests and localized status templates", async () => {
    const user = userEvent.setup();
    const tree = mount();
    tree.setAttribute("loading-label", "Caricamento di {name}…");
    tree.nodes = [
      { value: "one", hasChildren: true },
      { value: "two", hasChildren: true },
    ];
    tree.expanded = [];
    const values: string[] = [];
    tree.addEventListener("load-children", (event) =>
      values.push((event as CustomEvent).detail.value),
    );
    await user.click(screen.getByRole("treeitem", { name: /one/ }).querySelector("button")!);
    await user.click(screen.getByRole("treeitem", { name: /two/ }).querySelector("button")!);
    expect(values).toEqual(["one", "two"]);
    expect(screen.getByText("Caricamento di one…")).toBeInTheDocument();
    expect(screen.getByText("Caricamento di two…")).toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    mount();
    expect(await axe(document.body)).toHaveNoViolations();
  });
});
