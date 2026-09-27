<script lang="ts" module>
  import type { SidebarItem, SidebarSection } from "./types";

  // eslint-disable-next-line no-import-assign -- false positive: TS type re-export
  export type { SidebarItem, SidebarSection };
</script>

<script lang="ts">
  /**
   * Sidebar — the application's side navigation: an optional logo, labelled
   * sections of items (icon + label), and a footer snippet. Items are links when
   * given an `href`, otherwise buttons that report `onSelect`. The current
   * destination is marked with `aria-current="page"`.
   *
   * Three things stay with the application: the routing, which destination is
   * current, and which viewport gets which presentation. This component reads
   * no media query; `mode` says what to render.
   *
   * Sections can collapse, the bar itself can collapse to a rail of icons, and
   * `mode="drawer"` puts the same navigation inside a Sheet Dialog (ADR 0013).
   * Themeable via `--ds-sidebar-*`.
   */
  import { untrack, type Snippet } from "svelte";
  import SheetDialog from "../sheet-dialog/SheetDialog.svelte";
  import type { SheetDialogSide } from "../sheet-dialog/create-sheet-dialog";
  import SidebarNav from "./SidebarNav.svelte";
  import { getI18n } from "../i18n/create-i18n";
  import { fail } from "../internal/dev";
  import { canRail, resolveSections } from "./identity";

  const { t, dir } = getI18n();

  interface Props {
    /** Groups of items, rendered in order with an optional heading each. */
    sections: SidebarSection[];
    /** The current destination's value. The application owns it. */
    value?: string | null;
    /** Accessible name for the navigation landmark. Defaults to the catalog's "Main". */
    label?: string;
    /** Called when an item without an `href` is activated. */
    onSelect?: (value: string) => void;
    /** How this viewport shows the navigation. The application decides. */
    mode?: "inline" | "drawer";
    /** The rail: labels hidden from sight, icons kept. */
    collapsed?: boolean;
    /**
     * Given, the rail toggle is rendered and reports every press, as long as
     * every destination carries an icon: without one there would be nothing to
     * show once the labels are hidden.
     */
    onCollapsedChange?: (collapsed: boolean) => void;
    /** Whether the drawer is open (`mode="drawer"`). */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /**
     * Which sections are open, by id. Given it, the application owns the set and
     * this component only reports presses; left out, the component keeps the set
     * itself and opens the section holding the current item.
     */
    openGroups?: string[];
    onOpenGroupsChange?: (openGroups: string[]) => void;
    /** Whether following an item closes the drawer. */
    closeOnNavigate?: boolean;
    /** Which edge the drawer comes from. Follows the writing direction. */
    side?: "inline-start" | "inline-end";
    /** The drawer's accessible name. Falls back to `label`. */
    title?: string;
    /** Whether the drawer renders its own trigger button. */
    renderTrigger?: boolean;
    /** Where focus goes when a drawer with no trigger of its own closes. */
    returnFocusTo?: string;
    /** The drawer trigger's content (`mode="drawer"`). Defaults to the catalog's label. */
    trigger?: Snippet;
    /** The logo at the top of the navigation. */
    logo?: Snippet;
    /** The footer at the bottom of the navigation. */
    footer?: Snippet;
  }

  let {
    sections,
    value = null,
    label,
    onSelect,
    mode = "inline",
    collapsed = $bindable(false),
    onCollapsedChange,
    open = $bindable(false),
    onOpenChange,
    openGroups,
    onOpenGroupsChange,
    closeOnNavigate = true,
    side = "inline-start",
    title,
    renderTrigger = true,
    returnFocusTo,
    trigger,
    logo,
    footer,
  }: Props = $props();

  const holdsCurrent = (section: SidebarSection, current: string | null) =>
    current != null && section.items.some((item) => item.value === current);

  // Resolved once per render: a collapsible section answers to its own id, and
  // a mistake there is loud in development and deterministic in production.
  const entries = $derived(resolveSections(sections));

  // The rail is only offered when every destination shows something without
  // its label. Otherwise it would hide the name and leave an empty control.
  const railable = $derived(canRail(sections));
  $effect.pre(() => {
    if (mode === "inline" && collapsed && !railable) {
      fail(
        "a collapsed sidebar needs an icon on every destination: without one a " +
          "destination shows nothing at all once the labels are out of sight",
      );
    }
  });
  const isRail = $derived(mode === "inline" && collapsed && railable);

  const resolvedLabel = $derived(label ?? $t("sidebar.label"));
  // The drawer's edge follows the writing direction, so one `side` value is
  // right in both directions.
  const edge = (start: boolean, rtl: boolean): SheetDialogSide =>
    start === rtl ? "right" : "left";
  const sheetSide = $derived(edge(side === "inline-start", $dir === "rtl"));

  // The ids this component keeps open. While the application controls the set
  // this copy follows it, so handing `openGroups` back as undefined starts
  // from what is on screen rather than from what the component last held by
  // itself (ADR 0013). Seeded once from the first props.
  let ownGroups: string[] = $state.raw(
    untrack(() =>
      entries
        .filter(
          ({ section }) =>
            section.collapsible && (section.defaultOpen || holdsCurrent(section, value)),
        )
        .map(({ id }) => id),
    ),
  );

  // Which collapsible section holds the current destination. It moves when the
  // current destination moves and when the sections themselves change, and
  // both have to open it: a destination nobody can see is the same problem
  // either way.
  const holderId = $derived(
    entries.find(({ section }) => section.collapsible && holdsCurrent(section, value))?.id ?? null,
  );

  // Uncontrolled only: that section opens, silently. Controlled, the
  // application owns the set, so nothing moves and nothing is reported
  // (ADR 0013).
  let lastHolder = untrack(() => holderId);
  $effect.pre(() => {
    const next = holderId;
    untrack(() => {
      if (next === lastHolder) return;
      lastHolder = next;
      if (openGroups === undefined && next && !ownGroups.includes(next)) {
        ownGroups = [...ownGroups, next];
      }
    });
  });

  const openIds = $derived(openGroups ?? ownGroups);
  // While the application controls the set, the component's copy is that set,
  // so handing `openGroups` back continues from what was on screen. Nothing
  // else writes the copy meanwhile, or a set the application refused could
  // surface after the handback.
  $effect.pre(() => {
    if (openGroups !== undefined) ownGroups = openGroups;
  });

  const toggleGroup = (id: string) => {
    const next = openIds.includes(id) ? openIds.filter((open) => open !== id) : [...openIds, id];
    // Uncontrolled this is the new set; controlled the component writes
    // nothing, so the press only asks and the copy stays the application's.
    if (openGroups === undefined) ownGroups = next;
    onOpenGroupsChange?.(next);
  };

  const pressGroup = (id: string) => {
    // Pressing a section while the rail is collapsed opens the bar first: its
    // items would otherwise expand into a column too narrow to read them.
    if (isRail) {
      collapsed = false;
      onCollapsedChange?.(false);
      if (!openIds.includes(id)) toggleGroup(id);
      return;
    }
    toggleGroup(id);
  };

  const toggleCollapsed = () => {
    collapsed = !collapsed;
    onCollapsedChange?.(collapsed);
  };

  const closeDrawer = () => {
    if (mode !== "drawer" || !closeOnNavigate || !open) return;
    open = false;
    onOpenChange?.(false);
  };

  const handleOpenChange = (next: boolean) => {
    open = next;
    onOpenChange?.(next);
  };
</script>

{#snippet sheetTrigger()}{#if trigger}{@render trigger()}{:else}{$t("sidebar.open")}{/if}{/snippet}

{#if mode === "drawer"}
  <SheetDialog
    {open}
    {renderTrigger}
    {returnFocusTo}
    side={sheetSide}
    title={title ?? resolvedLabel}
    onOpenChange={handleOpenChange}
    trigger={sheetTrigger}
  >
    <SidebarNav
      {entries}
      {value}
      {openIds}
      {onSelect}
      label={resolvedLabel}
      {logo}
      {footer}
      mode="drawer"
      {side}
      collapsed={false}
      onNavigate={closeDrawer}
      onPressGroup={pressGroup}
    />
  </SheetDialog>
{:else}
  <SidebarNav
    {entries}
    {value}
    {openIds}
    {onSelect}
    collapsed={isRail}
    {side}
    label={resolvedLabel}
    {logo}
    {footer}
    mode="inline"
    collapseLabel={$t("sidebar.collapse")}
    expandLabel={$t("sidebar.expand")}
    onToggleCollapsed={onCollapsedChange && railable ? toggleCollapsed : undefined}
    onPressGroup={pressGroup}
  />
{/if}
