import { defineComponent, h, type PropType } from "vue";
import { useTreeView, type TreeNode, type VisibleNode } from "./use-tree-view";

export interface TreeViewProps {
  nodes: TreeNode[];
  /** Expanded parent values; bindable with `v-model:expanded`. */
  expanded?: string[];
  /** Selected value; bindable with `v-model:selected`. */
  selected?: string | null;
  disabled?: boolean;
  /** Accessible name for the tree (announced by screen readers). */
  label: string;
  /** Optional per-node display labels, keyed by node value. */
  labels?: Record<string, string>;
  /** Called whenever the expanded set changes. */
  onExpandedChange?: (expanded: string[]) => void;
  /** Called whenever the selected value changes. */
  onSelectedChange?: (selected: string) => void;
}

/** The disclosure chevron on a parent row; it rotates when the subtree opens. */
const TwistieGlyph = () =>
  h("svg", { viewBox: "0 0 16 16", width: "1em", height: "1em", focusable: "false" }, [
    h("path", {
      d: "M6 4l4 4-4 4",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.75",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }),
  ]);

/** The check marking the selected row. */
const CheckGlyph = () =>
  h("svg", { viewBox: "0 0 16 16", width: "1em", height: "1em", focusable: "false" }, [
    h("path", {
      d: "M3.5 8.5l3 3 6-6.5",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.75",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }),
  ]);

/**
 * TreeView — the styled tree (WAI-ARIA tree pattern): single selection,
 * expand/collapse, roving tabindex and full arrow-key navigation. Ported from
 * the Svelte adapter; behaviour and accessibility come from the headless tree
 * in `@design-system/core`.
 *
 * Pass a (possibly nested) `nodes` forest. Each node renders a row; parents get
 * a disclosure twistie. Labels default to the node `value`; override per node
 * via the `label` slot (which receives `{ node }`) or a `labels` map.
 *
 * The tree renders as a flat list of `treeitem`s carrying `aria-level`,
 * `aria-setsize` and `aria-posinset` (a valid alternative to nested `group`s),
 * which keeps the DOM order aligned with keyboard navigation. The control needs
 * an accessible name via `label`. Colors are themeable (`--ds-tree-*`).
 */
export const TreeView = defineComponent({
  name: "TreeView",
  props: {
    nodes: { type: Array as PropType<TreeNode[]>, required: true },
    expanded: { type: Array as PropType<string[]>, default: () => [] },
    selected: { type: String as PropType<string | null>, default: null },
    disabled: { type: Boolean, default: false },
    label: { type: String, required: true },
    labels: { type: Object as PropType<Record<string, string>>, default: undefined },
    onExpandedChange: {
      type: Function as PropType<(expanded: string[]) => void>,
      default: undefined,
    },
    onSelectedChange: {
      type: Function as PropType<(selected: string) => void>,
      default: undefined,
    },
  },
  emits: {
    "update:expanded": (expanded: string[]) => Array.isArray(expanded),
    "update:selected": (selected: string) => typeof selected === "string",
  },
  setup(props, { emit, slots }) {
    const { api, visible, expanded, selected, rootRef } = useTreeView(() => ({
      nodes: props.nodes,
      expanded: props.expanded,
      selected: props.selected,
      disabled: props.disabled,
      onExpandedChange: (next: string[]) => {
        emit("update:expanded", next);
        props.onExpandedChange?.(next);
      },
      onSelectedChange: (next: string) => {
        emit("update:selected", next);
        props.onSelectedChange?.(next);
      },
    }));

    // The twistie sits inside the row, whose click selects; stop the press
    // there so expanding never doubles as selecting.
    const toggle = (event: Event, node: VisibleNode) => {
      event.stopPropagation();
      api.value.toggle(node.value);
    };

    return () =>
      h(
        "ul",
        { ...api.value.rootProps, ref: rootRef, class: "tree", "aria-label": props.label },
        visible.value.map((node) => {
          const isSelected = selected.value === node.value;
          const isExpanded = expanded.value.includes(node.value);

          return h(
            "li",
            {
              ...api.value.getItemProps(node.value),
              key: node.value,
              class: ["tree__item", { "tree__item--selected": isSelected }],
              style: { "--_tree-level": String(node.level) },
            },
            [
              node.hasChildren
                ? h(
                    "button",
                    {
                      type: "button",
                      class: ["tree__twistie", { "tree__twistie--open": isExpanded }],
                      tabindex: "-1",
                      "aria-hidden": "true",
                      onClick: (event: Event) => toggle(event, node),
                    },
                    [TwistieGlyph()],
                  )
                : h("span", { class: "tree__twistie-spacer", "aria-hidden": "true" }),

              slots.icon
                ? h("span", { class: "tree__icon", "aria-hidden": "true" }, slots.icon({ node }))
                : null,

              h(
                "span",
                { class: "tree__label" },
                slots.label?.({ node }) ?? props.labels?.[node.value] ?? node.value,
              ),

              // The check's slot is always reserved (hidden when unselected) so
              // a selected row is no wider than its siblings.
              h(
                "span",
                {
                  class: ["tree__check", { "tree__check--shown": isSelected }],
                  "aria-hidden": "true",
                },
                [CheckGlyph()],
              ),
            ],
          );
        }),
      );
  },
});
