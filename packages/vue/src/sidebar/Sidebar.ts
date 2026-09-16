import { computed, defineComponent, h, ref, watch, type Component, type PropType } from "vue";
import { Icon } from "../icon/Icon";
import { useI18n } from "../i18n/i18n";
import { SidebarGroup } from "./SidebarGroup";
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

    // Controllable mirrors (ADR 0011): the press moves the control and reports
    // once, and a prop moving from outside is reflected without a report.
    const collapsed = ref(props.collapsed);
    watch(
      () => props.collapsed,
      (next) => {
        collapsed.value = next;
      },
    );
    const drawerOpen = ref(props.open);
    watch(
      () => props.open,
      (next) => {
        drawerOpen.value = next;
      },
    );
    // The rail exists only inline: a drawer is never a column of icons.
    const isRail = computed(() => props.mode === "inline" && collapsed.value);

    const toggleGroup = (id: string) => {
      const next = openIds.value.includes(id)
        ? openIds.value.filter((open) => open !== id)
        : [...openIds.value, id];
      if (props.openGroups === undefined) ownGroups.value = next;
      props.onOpenGroupsChange?.(next);
    };

    const setCollapsed = (next: boolean) => {
      collapsed.value = next;
      props.onCollapsedChange?.(next);
    };

    const pressGroup = (id: string) => {
      // Pressing a section while the rail is collapsed opens the bar first: its
      // items would otherwise expand into a column too narrow to read them.
      if (isRail.value) {
        setCollapsed(false);
        if (!openIds.value.includes(id)) toggleGroup(id);
        return;
      }
      toggleGroup(id);
    };

    const closeDrawer = () => {
      if (props.mode !== "drawer" || !props.closeOnNavigate || !drawerOpen.value) return;
      drawerOpen.value = false;
      props.onOpenChange?.(false);
    };

    const item = (entry: SidebarItem) => {
      const current = entry.value === props.value;
      const label = h(
        "span",
        { class: isRail.value ? "sidebar__label--hidden" : "sidebar__label" },
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
      return isRail.value
        ? h(Tooltip, { text: entry.label, placement: "right" }, { default: () => node })
        : node;
    };

    const list = (section: SidebarSection) =>
      h(
        "ul",
        { class: ["sidebar__list", { "sidebar__list--collapsed": isRail.value }] },
        section.items.map((entry) => h("li", { key: entry.value }, [item(entry)])),
      );

    const nav = (mode: "inline" | "drawer") => {
      const { t } = i18n.value;
      const resolvedLabel = props.label ?? t("sidebar.label");
      const railed = mode === "inline" && collapsed.value;
      return h(
        "nav",
        {
          class: ["sidebar", { "sidebar--collapsed": railed }],
          "aria-label": resolvedLabel,
          "data-mode": mode,
          "data-side": props.side,
          "data-collapsed": railed ? "" : undefined,
        },
        [
          slots.logo ? h("div", { class: "sidebar__logo" }, slots.logo()) : null,
          mode === "inline" && props.onCollapsedChange
            ? h(
                "button",
                {
                  type: "button",
                  class: "sidebar__rail-toggle",
                  "aria-pressed": railed,
                  onClick: () => setCollapsed(!railed),
                },
                [
                  h("span", { class: "sidebar__icon", "aria-hidden": "true" }, [
                    h(
                      Icon,
                      { size: "1em" },
                      {
                        default: () =>
                          h("polyline", { points: railed ? "9 18 15 12 9 6" : "15 18 9 12 15 6" }),
                      },
                    ),
                  ]),
                  h(
                    "span",
                    { class: "sidebar__label--hidden" },
                    railed ? t("sidebar.expand") : t("sidebar.collapse"),
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
                    collapsed: railed,
                    onToggle: () => pressGroup(id),
                  },
                  { default: () => [list(section)] },
                )
              : h("div", { class: "sidebar__section", key: index }, [
                  section.label
                    ? h(
                        "p",
                        {
                          class: ["sidebar__section-label", { "sidebar__label--hidden": railed }],
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
          open: drawerOpen.value,
          renderTrigger: props.renderTrigger,
          returnFocusTo: props.returnFocusTo,
          side: sheetSide.value,
          title: props.title ?? props.label ?? t("sidebar.label"),
          onOpenChange: (next: boolean) => {
            drawerOpen.value = next;
            props.onOpenChange?.(next);
          },
        },
        {
          trigger: () => slots.trigger?.() ?? t("sidebar.open"),
          default: () => [nav("drawer")],
        },
      );
    };
  },
});
