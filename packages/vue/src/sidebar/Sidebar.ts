import { navigationBar } from "@design-system/core";
import { computed, defineComponent, h, ref, watch, type PropType } from "vue";
import { Icon } from "../icon/Icon";
import { useI18n } from "../i18n/i18n";
import { fail } from "../internal/dev";
import { useBadgeAnnouncements } from "../internal/use-badge-announcements";
import { useStableId } from "../internal/use-stable-id";
import { normalizeProps } from "../normalize";
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
 * Items take the Navigation Bar's destinations as they are. A `badge` shows
 * a count or a dot, its text is part of the item's name, and when it appears
 * or changes it is announced politely once (`announce: false` silences it);
 * while a modal dialog outside the sidebar is open the announcement waits for
 * it to close (ADR 0016). An `unavailable` item stays visible and focusable
 * with its reason shown and read as its description, and activating it does
 * nothing. To hide a destination, leave it out.
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

    const id = useStableId("ds-sidebar");
    // A badge that appears or changes is announced once; nothing on mount.
    const { spoken, live } = useBadgeAnnouncements(
      () => props.sections.flatMap((section) => section.items),
      () => i18n.value.t,
    );

    const lock = () =>
      h(Icon, { size: "1em" }, () => [
        h("rect", { x: 5, y: 11, width: 14, height: 10, rx: 2 }),
        h("path", { d: "M8 11V7a4 4 0 0 1 8 0v4" }),
      ]);

    const item = (entry: SidebarItem, reasonId: string) => {
      const current = entry.value === props.value;
      const { badge, unavailable } = entry;
      const label = h(
        "span",
        { class: isRail.value ? "sidebar__label--hidden" : "sidebar__label" },
        [
          entry.label,
          badge ? h("span", { class: "sidebar__label--hidden" }, `, ${badge.label}`) : null,
          unavailable
            ? h(
                "span",
                { class: "sidebar__reason", id: reasonId, "aria-hidden": "true" },
                unavailable.reason,
              )
            : null,
        ],
      );
      const content = [
        entry.icon ? h("span", { class: "sidebar__icon" }, [h(entry.icon)]) : null,
        label,
        unavailable
          ? h("span", { class: "sidebar__status", "aria-hidden": "true" }, [lock()])
          : null,
        badge
          ? h(
              "span",
              {
                class: ["sidebar__badge", { "sidebar__badge--dot": badge.content === undefined }],
                "aria-hidden": "true",
              },
              badge.content ?? "",
            )
          : null,
      ];
      const node = h(
        entry.href === undefined ? "button" : "a",
        {
          class: ["sidebar__item", { "sidebar__item--active": current }],
          ...normalizeProps(
            navigationBar.destinationProps({
              destination: entry,
              current,
              reasonId,
              // Read at activation time, so a replaced callback is the one called.
              onSelect: (value) => props.onSelect?.(value),
              onNavigate: closeDrawer,
            }),
          ),
        },
        content,
      );
      // The rail hides names from sight, never from a screen reader, and the
      // tooltip gives them back to whoever is looking.
      if (!isRail.value) return node;
      const text = unavailable
        ? i18n.value.t("sidebar.unavailableTooltip", {
            label: entry.label,
            reason: unavailable.reason,
          })
        : entry.label;
      return h(Tooltip, { text, placement: "right" }, { default: () => node });
    };

    const list = (section: SidebarSection, sectionIndex: number) =>
      h(
        "ul",
        { class: ["sidebar__list", { "sidebar__list--collapsed": isRail.value }] },
        section.items.map((entry, index) =>
          h("li", { key: entry.value }, [item(entry, `${id}-reason-${sectionIndex}-${index}`)]),
        ),
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
          ...entries.value.map(({ section, id }, sectionIndex) => {
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
                  { default: () => [list(section, sectionIndex)] },
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
                  list(section, sectionIndex),
                ]);
          }),
          slots.footer ? h("div", { class: "sidebar__footer" }, slots.footer()) : null,
          h(
            "div",
            { class: "sidebar__live", "aria-live": "polite", ref: live },
            spoken.value.map((announcement) =>
              h("span", { key: announcement.value }, announcement.text),
            ),
          ),
        ],
      );
    };

    // The drawer's edge follows the writing direction, so one `side` value is
    // right in both directions.
    const sheetSide = computed<SheetDialogSide>(() =>
      props.side === "inline-start" ? "start" : "end",
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
