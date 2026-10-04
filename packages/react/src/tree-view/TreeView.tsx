import { useState, type CSSProperties, type ReactNode } from "react";
import { useI18n } from "../i18n/i18n";
import { cx } from "../internal/cx";
import {
  useTreeView,
  type TreeLoadRequest,
  type TreeNode,
  type VisibleTreeNode,
} from "./use-tree-view";

export interface TreeViewProps {
  nodes: TreeNode[];
  /** Initial (uncontrolled) or current (controlled) expanded parents. */
  expanded?: string[];
  /** Initial (uncontrolled) or current (controlled) selected node. */
  selected?: string | null;
  /** Unloaded parent values with an active request. */
  loading?: string[];
  /** Unloaded parent values whose latest request failed. */
  loadErrors?: string[];
  disabled?: boolean;
  /** Accessible name for the tree (announced by screen readers). */
  label: string;
  /** Optional per-node display labels, keyed by node value. */
  labels?: Record<string, string>;
  /** Called whenever the expanded set changes. */
  onExpandedChange?: (expanded: string[]) => void;
  /** Called whenever the selected value changes. */
  onSelectedChange?: (selected: string) => void;
  /** Requests children from the application; the component never fetches. */
  onLoadChildren?: (request: TreeLoadRequest) => void;
  /** Leading icon of a row, hidden from assistive tech. */
  renderIcon?: (node: VisibleTreeNode) => ReactNode;
  /** A row's label. Defaults to `labels[node.value]`, then the node value. */
  renderLabel?: (node: VisibleTreeNode) => ReactNode;
}

const NONE: string[] = [];

const twistie = (
  <svg viewBox="0 0 16 16" width="1em" height="1em" focusable="false">
    <path
      d="M6 4l4 4-4 4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const check = (
  <svg viewBox="0 0 16 16" width="1em" height="1em" focusable="false">
    <path
      d="M3.5 8.5l3 3 6-6.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface Announcement {
  /** The load message of each node that has one, as of the last render. */
  messages: Map<string, string>;
  key: string;
  /** What the live region says. */
  text: string;
}

/**
 * TreeView: the styled tree (WAI-ARIA tree pattern): single selection,
 * expand and collapse, roving tabindex and full arrow-key navigation.
 * Behaviour and accessibility come from the headless tree in
 * `@design-system/core`.
 *
 * Pass a (possibly nested) `nodes` forest. Each node renders a row; parents
 * get a disclosure twistie. Labels default to the node `value`; override them
 * with a `labels` map or `renderLabel`. The tree is a flat list of
 * `treeitem`s carrying `aria-level`, `aria-setsize` and `aria-posinset`, which
 * keeps the DOM order aligned with keyboard navigation.
 *
 * A node with `hasChildren: true` and no `children` loads on demand
 * (ADR 0014): expanding it calls `onLoadChildren`, and the row says it is
 * loading, or that it failed, until the application answers. Those messages
 * are announced through one visually hidden live region that stays in the
 * page. Colors are themeable (`--ds-tree-*`).
 */
export function TreeView({
  nodes,
  expanded = NONE,
  selected = null,
  loading = NONE,
  loadErrors = NONE,
  disabled = false,
  label,
  labels,
  onExpandedChange,
  onSelectedChange,
  onLoadChildren,
  renderIcon,
  renderLabel,
}: TreeViewProps) {
  const { t } = useI18n();
  const { api, visible } = useTreeView({
    nodes,
    expanded,
    selected,
    loading,
    loadErrors,
    disabled,
    onExpandedChange,
    onSelectedChange,
    onLoadChildren,
  });

  const nameOf = (node: VisibleTreeNode) => labels?.[node.value] ?? node.value;
  const messageOf = (node: VisibleTreeNode) =>
    node.loadState === "error"
      ? t("tree.loadError", { name: nameOf(node) })
      : node.loadState === "loading"
        ? t("tree.loading", { name: nameOf(node) })
        : null;

  // Only the messages that are new since the last render are announced.
  const messages = new Map<string, string>();
  for (const node of visible) {
    const message = messageOf(node);
    if (message !== null) messages.set(node.value, message);
  }
  const key = JSON.stringify([...messages]);
  const [live, setLive] = useState<Announcement>(() => ({
    messages,
    key,
    text: [...messages.values()].join(" "),
  }));
  if (live.key !== key) {
    const fresh = [...messages].filter(([value, text]) => live.messages.get(value) !== text);
    setLive({
      messages,
      key,
      text: fresh.length ? fresh.map(([, text]) => text).join(" ") : messages.size ? live.text : "",
    });
  }

  return (
    <>
      <ul className="tree" {...api.rootProps} aria-label={label}>
        {visible.map((node) => {
          const isSelected = api.selected === node.value;
          const message = messageOf(node);
          return (
            <li
              key={node.value}
              className={cx("tree__item", isSelected && "tree__item--selected")}
              style={{ "--_tree-level": node.level } as CSSProperties}
              {...api.getItemProps(node.value)}
            >
              {node.hasChildren ? (
                <button
                  type="button"
                  className={cx("tree__twistie", node.expanded && "tree__twistie--open")}
                  tabIndex={-1}
                  aria-hidden="true"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (node.loadState === "error") api.retryLoad(node.value);
                    else api.toggle(node.value);
                  }}
                >
                  {twistie}
                </button>
              ) : (
                <span className="tree__twistie-spacer" aria-hidden="true" />
              )}
              {renderIcon ? (
                <span className="tree__icon" aria-hidden="true">
                  {renderIcon(node)}
                </span>
              ) : null}
              <span id={node.labelId} className="tree__label">
                {renderLabel ? renderLabel(node) : nameOf(node)}
              </span>
              {message !== null ? (
                // Describes the row; the live region below announces it.
                <span
                  id={node.loadStatusId}
                  className={cx(
                    "tree__load-status",
                    node.loadState === "error" && "tree__load-status--error",
                  )}
                >
                  {message}
                </span>
              ) : null}
              {/* The check's space is always reserved, so a selected row is no wider. */}
              <span
                className={cx("tree__check", isSelected && "tree__check--shown")}
                aria-hidden="true"
              >
                {check}
              </span>
            </li>
          );
        })}
      </ul>
      <span className="tree__live" role="status" aria-atomic="true">
        {live.text}
      </span>
    </>
  );
}
