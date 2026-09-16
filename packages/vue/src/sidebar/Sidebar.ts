import { collapsible as collapsibleCore } from "@design-system/core";
import { computed, defineComponent, h, ref, watch, type Component, type PropType } from "vue";
import { useI18n } from "../i18n/i18n";
import { normalizeProps } from "../normalize";
import { useStableId } from "../internal/use-stable-id";
import { SheetDialog } from "../sheet-dialog/SheetDialog";
import { Tooltip } from "../tooltip/Tooltip";
import type { SheetDialogSide } from "../sheet-dialog/use-sheet-dialog";

/** One destination in the sidebar. */
export interface SidebarItem {
  value: string;
  label: string;
  /** Renders the item as a link. Without it the item reports `onSelect`. */
  href?: string;
  /**
   * Optional leading icon (any Vue component). Wrap it in `markRaw()` so Vue
   * keeps it out of the reactive proxy it builds for the `sections` prop.
   */
  icon?: Component;
}

/** A labelled group of destinations. */
export interface SidebarSection {
  /** Optional section heading. */
  label?: string;
  items: SidebarItem[];
  /**
   * Turns the heading into a disclosure. Needs a `label`: without one there is
   * nothing to press. Plain sections stay exactly as they were.
   */
  collapsible?: boolean;
  /** Identifies the section in `openGroups`. Falls back to the label. */
  id?: string;
  /** Open on first render. A section holding the current item opens anyway. */
  defaultOpen?: boolean;
}

export interface SidebarProps {
  sections: SidebarSection[];
  /** The current destination's value. The application owns it. */
  value?: string | null;
  /** Accessible name for the navigation landmark. Defaults to the catalog's "Main". */
  label?: string;
  onSelect?: (value: string) => void;
  mode?: "inline" | "drawer";
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  openGroups?: string[];
  onOpenGroupsChange?: (openGroups: string[]) => void;
  closeOnNavigate?: boolean;
  side?: "inline-start" | "inline-end";
  title?: string;
  renderTrigger?: boolean;
  returnFocusTo?: string;
}

/** One collapsible section: the disclosure wiring comes from the core. */
const SidebarGroup = defineComponent({
  name: "SidebarGroup",
  props: {
    label: { type: String, required: true },
    open: { type: Boolean, default: false },
    collapsed: { type: Boolean, default: false },
    onToggle: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props, { slots }) {
    const id = useStableId("ds-sidebar-group");
    // This section holds no state of its own: what it shows is the prop, and a
    // press is a request the Sidebar answers. A set the application controls
    // therefore moves only when the application moves it (ADR 0011).
    const api = computed(() =>
      collapsibleCore.connect({
        state: { open: props.open, disabled: false, id },
        setOpen: () => props.onToggle?.(),
        normalize: normalizeProps,
      }),
    );

    return () => {
      const { triggerProps, contentProps } = api.value;
      return h("div", { class: "sidebar__section", "data-state": props.open ? "open" : "closed" }, [
        h("button", { ...triggerProps, class: "sidebar__group" }, [
          h(
            "span",
            { class: ["sidebar__group-label", { "sidebar__label--hidden": props.collapsed }] },
            props.label,
          ),
          h("span", {
            class: ["sidebar__chevron", { "sidebar__chevron--open": props.open }],
            "aria-hidden": "true",
          }),
        ]),
        h("div", { ...contentProps, class: "sidebar__group-content" }, slots.default?.()),
      ]);
    };
  },
});

/**
 * Sidebar: the application's side navigation, ported from the Svelte adapter.
 * An optional logo, labelled sections of items (icon plus label), and a footer.
 * Items with an `href` render as links, the rest as buttons that report
 * `onSelect(value)`. The current destination carries `aria-current="page"`.
 *
 * Three things stay with the application: the routing, which destination is
 * current, and which viewport gets which presentation. This component reads no
 * media query; `mode` says what to render.
 *
 * Slots: `logo`, `footer` and `trigger`. Themeable via `--ds-sidebar-*`.
 */
export const Sidebar = defineComponent({
  name: "Sidebar",
  props: {
    sections: { type: Array as PropType<SidebarSection[]>, required: true },
    value: { type: String as PropType<string | null>, default: null },
    label: { type: String, default: undefined },
    onSelect: { type: Function as PropType<(value: string) => void>, default: undefined },
    mode: { type: String as PropType<"inline" | "drawer">, default: "inline" },
    collapsed: { type: Boolean, default: false },
    onCollapsedChange: {
      type: Function as PropType<(collapsed: boolean) => void>,
      default: undefined,
    },
    open: { type: Boolean, default: false },
    onOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
    openGroups: { type: Array as PropType<string[]>, default: undefined },
    onOpenGroupsChange: {
      type: Function as PropType<(openGroups: string[]) => void>,
      default: undefined,
    },
    closeOnNavigate: { type: Boolean, default: true },
    side: { type: String as PropType<"inline-start" | "inline-end">, default: "inline-start" },
    title: { type: String, default: undefined },
    renderTrigger: { type: Boolean, default: true },
    returnFocusTo: { type: String, default: undefined },
  },
  setup(props, { slots }) {
    const i18n = useI18n();

    const sectionId = (section: SidebarSection, index: number) =>
      section.id ?? section.label ?? String(index);
    const holdsCurrent = (section: SidebarSection) =>
      props.value != null && section.items.some((item) => item.value === props.value);

    // The ids this component keeps open while the consumer is not controlling
    // them.
    const ownGroups = ref(
      props.sections
        .map((section, index) => ({ section, id: sectionId(section, index) }))
        .filter(
          ({ section }) => section.collapsible && (section.defaultOpen || holdsCurrent(section)),
        )
        .map(({ id }) => id),
    );

    // Uncontrolled only: the section holding the current item opens whenever
    // the current item moves. Controlled, the application owns the set, so a
    // change of `value` moves nothing and reports nothing (ADR 0013).
    watch(
      () => props.value,
      () => {
        if (props.openGroups !== undefined) return;
        const holder = props.sections
          .map((section, index) => ({ section, id: sectionId(section, index) }))
          .find(({ section }) => section.collapsible && holdsCurrent(section));
        if (holder && !ownGroups.value.includes(holder.id)) {
          ownGroups.value = [...ownGroups.value, holder.id];
        }
      },
    );

    const openIds = computed(() => props.openGroups ?? ownGroups.value);

    const toggleGroup = (id: string) => {
      const next = openIds.value.includes(id)
        ? openIds.value.filter((open) => open !== id)
        : [...openIds.value, id];
      if (props.openGroups === undefined) ownGroups.value = next;
      props.onOpenGroupsChange?.(next);
    };

    const pressGroup = (id: string) => {
      // Pressing a section while the rail is collapsed opens the bar first: its
      // items would otherwise expand into a column too narrow to read them.
      if (props.collapsed) {
        props.onCollapsedChange?.(false);
        if (!openIds.value.includes(id)) toggleGroup(id);
        return;
      }
      toggleGroup(id);
    };

    const closeDrawer = () => {
      if (props.mode !== "drawer" || !props.closeOnNavigate || !props.open) return;
      props.onOpenChange?.(false);
    };

    const item = (entry: SidebarItem) => {
      const current = entry.value === props.value;
      const label = h(
        "span",
        { class: props.collapsed ? "sidebar__label--hidden" : "sidebar__label" },
        entry.label,
      );
      const content = [
        entry.icon ? h("span", { class: "sidebar__icon" }, [h(entry.icon)]) : null,
        label,
      ];
      const shared = {
        class: ["sidebar__item", { "sidebar__item--active": current }],
        "aria-current": current ? "page" : undefined,
        "data-current": current ? "" : undefined,
      };
      const node = entry.href
        ? h("a", { ...shared, href: entry.href, onClick: () => closeDrawer() }, content)
        : h(
            "button",
            {
              ...shared,
              type: "button",
              onClick: () => {
                props.onSelect?.(entry.value);
                closeDrawer();
              },
            },
            content,
          );
      // The rail hides names from sight, never from a screen reader, and the
      // tooltip gives them back to whoever is looking.
      return props.collapsed
        ? h(Tooltip, { text: entry.label, placement: "right" }, { default: () => node })
        : node;
    };

    const list = (section: SidebarSection) =>
      h(
        "ul",
        { class: ["sidebar__list", { "sidebar__list--collapsed": props.collapsed }] },
        section.items.map((entry) => h("li", { key: entry.value }, [item(entry)])),
      );

    const nav = (mode: "inline" | "drawer") => {
      const { t } = i18n.value;
      const resolvedLabel = props.label ?? t("sidebar.label");
      const collapsed = mode === "drawer" ? false : props.collapsed;
      return h(
        "nav",
        {
          class: ["sidebar", { "sidebar--collapsed": collapsed }],
          "aria-label": resolvedLabel,
          "data-mode": mode,
          "data-side": props.side,
          "data-collapsed": collapsed ? "" : undefined,
        },
        [
          slots.logo ? h("div", { class: "sidebar__logo" }, slots.logo()) : null,
          mode === "inline" && props.onCollapsedChange
            ? h(
                "button",
                {
                  type: "button",
                  class: "sidebar__rail-toggle",
                  "aria-pressed": collapsed,
                  onClick: () => props.onCollapsedChange?.(!collapsed),
                },
                [
                  h("span", { class: "sidebar__icon", "aria-hidden": "true" }),
                  h(
                    "span",
                    { class: "sidebar__label--hidden" },
                    collapsed ? t("sidebar.expand") : t("sidebar.collapse"),
                  ),
                ],
              )
            : null,
          ...props.sections.map((section, index) => {
            const id = sectionId(section, index);
            return section.collapsible && section.label
              ? h(
                  SidebarGroup,
                  {
                    key: id,
                    label: section.label,
                    open: openIds.value.includes(id),
                    collapsed,
                    onToggle: () => pressGroup(id),
                  },
                  { default: () => [list(section)] },
                )
              : h("div", { class: "sidebar__section", key: id }, [
                  section.label
                    ? h(
                        "p",
                        {
                          class: [
                            "sidebar__section-label",
                            { "sidebar__label--hidden": collapsed },
                          ],
                        },
                        section.label,
                      )
                    : null,
                  list(section),
                ]);
          }),
          slots.footer ? h("div", { class: "sidebar__footer" }, slots.footer()) : null,
        ],
      );
    };

    // The drawer's edge follows the writing direction, so one `side` value is
    // right in both directions.
    const sheetSide = computed<SheetDialogSide>(() =>
      (props.side === "inline-start") === (i18n.value.dir === "rtl") ? "right" : "left",
    );

    return () => {
      const { t } = i18n.value;
      if (props.mode !== "drawer") return nav("inline");
      return h(
        SheetDialog,
        {
          open: props.open,
          renderTrigger: props.renderTrigger,
          returnFocusTo: props.returnFocusTo,
          side: sheetSide.value,
          title: props.title ?? props.label ?? t("sidebar.label"),
          onOpenChange: (next: boolean) => props.onOpenChange?.(next),
        },
        {
          trigger: () => slots.trigger?.() ?? t("sidebar.open"),
          default: () => [nav("drawer")],
        },
      );
    };
  },
});
