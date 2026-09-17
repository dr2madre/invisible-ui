import { computed, defineComponent, h, ref, watch, type PropType } from "vue";
import { Icon } from "../icon/Icon";
import { useI18n } from "../i18n/i18n";
import { fail } from "../internal/dev";
import { canRail, resolveSections } from "./identity";
import { SidebarGroup } from "./SidebarGroup";
import type { SidebarItem, SidebarSection } from "./types";

export type {
  SidebarItem,
  SidebarSection,
  SidebarPlainSection,
  SidebarCollapsibleSection,
} from "./types";
import { SheetDialog } from "../sheet-dialog/SheetDialog";
import { Tooltip } from "../tooltip/Tooltip";
import type { SheetDialogSide } from "../sheet-dialog/use-sheet-dialog";

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
    /**
     * Given, the rail toggle is rendered and reports every press, as long as
     * every destination carries an icon: without one there would be nothing to
     * show once the labels are hidden.
     */
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

    const holdsCurrent = (section: SidebarSection) =>
      props.value != null && section.items.some((item) => item.value === props.value);

    // Resolved once per render: a collapsible section answers to its own id,
    // and a mistake there is loud in development and deterministic in
    // production.
    const entries = computed(() => resolveSections(props.sections));
    // The rail is only offered when every destination shows something without
    // its label. Otherwise it would hide the name and leave an empty control.
    const railable = computed(() => canRail(props.sections));

    // The ids this component keeps open while the consumer is not controlling
    // them.
    // The ids this component keeps open. While the application controls the
    // set this copy follows it, so handing `openGroups` back as undefined
    // starts from what is on screen (ADR 0013).
    const ownGroups = ref(
      resolveSections(props.sections)
        .filter(
          ({ section }) => section.collapsible && (section.defaultOpen || holdsCurrent(section)),
        )
        .map(({ id }) => id),
    );

    // Which collapsible section holds the current destination. It moves when
    // the current destination moves and when the sections themselves change,
    // and both have to open it: a destination nobody can see is the same
    // problem either way.
    const holderId = computed(
      () =>
        entries.value.find(({ section }) => section.collapsible && holdsCurrent(section))?.id ??
        null,
    );

    // Uncontrolled only: that section opens, silently. Controlled, the
    // application owns the set, so nothing moves and nothing is reported
    // (ADR 0013).
    watch(holderId, (id) => {
      if (props.openGroups !== undefined || !id) return;
      if (!ownGroups.value.includes(id)) ownGroups.value = [...ownGroups.value, id];
    });

    // While the application controls the set, this copy is that set, so
    // handing `openGroups` back continues from what was on screen. Nothing
    // else writes the copy meanwhile, or a set the application refused could
    // surface after the handback.
    watch(
      () => props.openGroups,
      (next) => {
        if (next !== undefined) ownGroups.value = next;
      },
      { immediate: true },
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
    // The rail exists only inline, and only when every destination shows
    // something without its label.
    const isRail = computed(() => props.mode === "inline" && collapsed.value && railable.value);
    watch(
      () => props.mode === "inline" && collapsed.value && !railable.value,
      (refused) => {
        if (refused) {
          fail(
            "a collapsed sidebar needs an icon on every destination: without one a " +
              "destination shows nothing at all once the labels are out of sight",
          );
        }
      },
      { immediate: true },
    );

    const toggleGroup = (id: string) => {
      const next = openIds.value.includes(id)
        ? openIds.value.filter((open) => open !== id)
        : [...openIds.value, id];
      // Uncontrolled this is the new set; controlled the component writes
      // nothing, so the press only asks and the copy stays the application's.
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
      const railed = mode === "inline" && collapsed.value && railable.value;
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
          mode === "inline" && props.onCollapsedChange && railable.value
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
          // Keyed by the name the section answers to, which the resolver
          // makes unique: two sections may share a label, never an identity.
          ...entries.value.map(({ section, id }) => {
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
              : h("div", { class: "sidebar__section", key: id }, [
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
