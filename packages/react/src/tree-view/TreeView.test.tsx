import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { LocaleProvider } from "../i18n/i18n";
import { TreeView, type TreeViewProps } from "./TreeView";
import type { TreeNode } from "./use-tree-view";

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

const Fixture = (props: Partial<TreeViewProps>) => (
  <TreeView nodes={nodes} label="Project files" {...props} />
);
const item = (name: RegExp | string) => screen.getByRole("treeitem", { name });
const remote: TreeNode[] = [{ value: "remote", hasChildren: true }];

describe("React TreeView (styled)", () => {
  it("is a labelled flat tree with positional metadata", () => {
    render(<Fixture expanded={["src"]} />);
    expect(screen.getByRole("tree", { name: "Project files" })).toBeInTheDocument();
    const src = item(/src/);
    expect(src).toHaveAttribute("aria-expanded", "true");
    expect(src).toHaveAttribute("aria-level", "1");
    expect(src).toHaveAttribute("aria-setsize", "3");
    const index = item(/index\.ts/);
    expect(index).toHaveAttribute("aria-level", "2");
    expect(index).toHaveAttribute("aria-posinset", "1");
    expect(index).not.toHaveAttribute("aria-expanded");
    // `lib` is collapsed, so its children are not rendered.
    expect(screen.queryByRole("treeitem", { name: /button\.ts/ })).not.toBeInTheDocument();
  });

  it("names rows from the labels map or renderLabel", () => {
    const { unmount } = render(<Fixture labels={{ "package.json": "Manifest" }} />);
    expect(item("Manifest")).toBeInTheDocument();
    unmount();
    render(<Fixture renderLabel={(node) => node.value.toUpperCase()} />);
    expect(item("SRC")).toBeInTheDocument();
  });

  it("reports expansion and selection once per user action", async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const onSelectedChange = vi.fn();
    render(
      <Fixture
        expanded={["src"]}
        onExpandedChange={onExpandedChange}
        onSelectedChange={onSelectedChange}
      />,
    );
    await user.click(item(/lib/).querySelector(".tree__twistie")!);
    expect(onExpandedChange).toHaveBeenCalledTimes(1);
    expect(onExpandedChange).toHaveBeenCalledWith(["src", "lib"]);
    expect(item(/button\.ts/)).toBeInTheDocument();
    expect(onSelectedChange).not.toHaveBeenCalled();

    await user.click(item(/index\.ts/));
    expect(item(/index\.ts/)).toHaveAttribute("aria-selected", "true");
    expect(onSelectedChange).toHaveBeenCalledTimes(1);
    expect(onSelectedChange).toHaveBeenCalledWith("index.ts");
  });

  it("moves one roving tab stop through visible enabled rows", async () => {
    const user = userEvent.setup();
    render(<Fixture expanded={["src"]} selected="index.ts" />);
    expect(item(/index\.ts/)).toHaveAttribute("tabindex", "0");
    expect(item(/src/)).toHaveAttribute("tabindex", "-1");

    item(/index\.ts/).focus();
    await user.keyboard("{ArrowDown}");
    expect(item(/lib/)).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(item(/button\.ts/)).toBeInTheDocument();
    await user.keyboard("{ArrowRight}");
    expect(item(/button\.ts/)).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(item(/lib/)).toHaveFocus();
    await user.keyboard("{End}");
    // The disabled row is skipped.
    expect(item(/package\.json/)).toHaveFocus();
    await user.keyboard("{Home}");
    expect(item(/src/)).toHaveFocus();
    expect(item(/src/)).toHaveAttribute("tabindex", "0");
    await user.keyboard("{Enter}");
    expect(item(/src/)).toHaveAttribute("aria-selected", "true");
  });

  it("follows the reading direction in right-to-left text", async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(
      <div dir="rtl">
        <Fixture expanded={[]} onExpandedChange={onExpandedChange} />
      </div>,
    );
    item(/src/).focus();
    // In right-to-left text Left Arrow points inward and expands.
    await user.keyboard("{ArrowLeft}");
    expect(onExpandedChange).toHaveBeenLastCalledWith(["src"]);
    await user.keyboard("{ArrowRight}");
    expect(onExpandedChange).toHaveBeenLastCalledWith([]);
  });

  it("reflects controlled props without reporting them", () => {
    const onExpandedChange = vi.fn();
    const onSelectedChange = vi.fn();
    const { rerender } = render(
      <Fixture onExpandedChange={onExpandedChange} onSelectedChange={onSelectedChange} />,
    );
    rerender(
      <Fixture
        expanded={["src", "lib"]}
        selected="input.ts"
        onExpandedChange={onExpandedChange}
        onSelectedChange={onSelectedChange}
      />,
    );
    expect(item(/input\.ts/)).toHaveAttribute("aria-selected", "true");
    expect(onExpandedChange).not.toHaveBeenCalled();
    expect(onSelectedChange).not.toHaveBeenCalled();
  });

  it("supports consumer-controlled search or paging through node replacement", () => {
    const { rerender } = render(<Fixture selected="package.json" />);
    rerender(<Fixture nodes={[{ value: "package.json" }]} selected="package.json" />);
    expect(screen.getAllByRole("treeitem")).toHaveLength(1);
    expect(item(/package\.json/)).toHaveAttribute("aria-selected", "true");
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<Fixture expanded={["src"]} selected="index.ts" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("React TreeView asynchronous children (ADR 0014)", () => {
  it("requests unloaded children once and announces loading", async () => {
    const user = userEvent.setup();
    const onLoadChildren = vi.fn();
    render(<Fixture nodes={remote} onLoadChildren={onLoadChildren} />);
    await user.click(item(/remote/).querySelector(".tree__twistie")!);
    expect(onLoadChildren).toHaveBeenCalledOnce();
    expect(onLoadChildren.mock.calls[0]![0]).toMatchObject({ value: "remote" });
    expect(item(/remote/)).toHaveAttribute("aria-busy", "true");
    // The name stays the label; the status describes the row.
    expect(item("remote")).toHaveAccessibleDescription("Loading remote…");
    expect(screen.getByRole("status")).toHaveTextContent("Loading remote…");

    item("remote").focus();
    await user.keyboard("{ArrowRight}");
    expect(onLoadChildren).toHaveBeenCalledOnce();
  });

  it("retries a failed load with a newer request id", async () => {
    const user = userEvent.setup();
    const onLoadChildren = vi.fn();
    const { rerender } = render(
      <Fixture
        nodes={remote}
        expanded={["remote"]}
        loadErrors={["remote"]}
        onLoadChildren={onLoadChildren}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Press Right Arrow to retry");
    item(/remote/).focus();
    await user.keyboard("{ArrowRight}");
    const firstId = onLoadChildren.mock.calls[0]![0].requestId;

    expect(item(/remote/)).toHaveAttribute("aria-busy", "true");

    // The application reports the retry failed too.
    rerender(
      <Fixture
        nodes={remote}
        expanded={["remote"]}
        loading={[]}
        loadErrors={["remote"]}
        onLoadChildren={onLoadChildren}
      />,
    );
    await user.click(item(/remote/).querySelector(".tree__twistie")!);
    expect(onLoadChildren).toHaveBeenCalledTimes(2);
    expect(onLoadChildren.mock.calls[1]![0].requestId).toBeGreaterThan(firstId);
  });

  it("keeps focus when loaded children replace the controlled forest", () => {
    const { rerender } = render(
      <Fixture nodes={remote} expanded={["remote"]} loading={["remote"]} />,
    );
    item(/remote/).focus();
    rerender(
      <Fixture
        nodes={[{ value: "remote", children: [{ value: "child" }] }]}
        expanded={["remote"]}
        loading={[]}
      />,
    );
    expect(item(/remote/)).toHaveFocus();
    expect(item(/child/)).toBeInTheDocument();
  });

  it("supports concurrent branch requests in the provider's language", async () => {
    const user = userEvent.setup();
    const values: string[] = [];
    render(
      <LocaleProvider locale="it" messages={{ "tree.loading": "Caricamento di {name}…" }}>
        <Fixture
          nodes={[
            { value: "one", hasChildren: true },
            { value: "two", hasChildren: true },
          ]}
          onLoadChildren={({ value }) => values.push(value)}
        />
      </LocaleProvider>,
    );
    await user.click(item(/one/).querySelector("button")!);
    await user.click(item(/two/).querySelector("button")!);
    expect(values).toEqual(["one", "two"]);
    const tree = screen.getByRole("tree");
    expect(within(tree).getByText("Caricamento di one…")).toBeInTheDocument();
    expect(within(tree).getByText("Caricamento di two…")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Caricamento di two…");
  });

  it("announces loading, error and success through one persistent status region", () => {
    const props = { nodes: remote, expanded: ["remote"] };
    const { rerender } = render(<Fixture {...props} />);
    const status = screen.getByRole("status");
    expect(status).toBeEmptyDOMElement();

    rerender(<Fixture {...props} loading={["remote"]} />);
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toHaveTextContent("Loading remote…");
    // The row text describes the item but is not a live region of its own.
    expect(screen.getAllByRole("status")).toHaveLength(1);

    rerender(<Fixture {...props} loading={[]} loadErrors={["remote"]} />);
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toHaveTextContent("Could not load remote.");

    rerender(
      <Fixture
        nodes={[{ value: "remote", children: [{ value: "child" }] }]}
        expanded={["remote"]}
        loadErrors={[]}
      />,
    );
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toBeEmptyDOMElement();
    expect(item(/child/)).toBeInTheDocument();
  });
});
