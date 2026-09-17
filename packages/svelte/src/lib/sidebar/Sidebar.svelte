<script lang="ts" context="module">
  export type { SidebarItem, SidebarSection } from "./types";
</script>

<script lang="ts">
  /**
   * Sidebar — the application's side navigation: an optional logo, labelled
   * sections of items (icon + label), and a footer slot. Items are links when
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
  import SheetDialog from "../sheet-dialog/SheetDialog.svelte";
  import type { SheetDialogSide } from "../sheet-dialog/create-sheet-dialog";
  import SidebarNav from "./SidebarNav.svelte";
  import { getI18n } from "../i18n/create-i18n";
  import { fail } from "../internal/dev";
  import { canRail, resolveSections } from "./identity";
  import type { SidebarSection } from "./types";

  const { t, dir } = getI18n();

  /** Groups of items, rendered in order with an optional heading each. */
  export let sections: SidebarSection[];
  /** The current destination's value. The application owns it. */
  export let value: string | null = null;
  /** Accessible name for the navigation landmark. Defaults to the catalog's "Main". */
  export let label: string | undefined = undefined;
  /** Called when an item without an `href` is activated. */
  export let onSelect: ((value: string) => void) | undefined = undefined;
  /** How this viewport shows the navigation. The application decides. */
  export let mode: "inline" | "drawer" = "inline";
  /** The rail: labels hidden from sight, icons kept. */
  export let collapsed = false;
  /**
   * Given, the rail toggle is rendered and reports every press, as long as
   * every destination carries an icon: without one there would be nothing to
   * show once the labels are hidden.
   */
  export let onCollapsedChange: ((collapsed: boolean) => void) | undefined = undefined;
  /** Whether the drawer is open (`mode="drawer"`). */
  export let open = false;
  export let onOpenChange: ((open: boolean) => void) | undefined = undefined;
  /**
   * Which sections are open, by id. Given it, the application owns the set and
   * this component only reports presses; left out, the component keeps the set
   * itself and opens the section holding the current item.
   */
  export let openGroups: string[] | undefined = undefined;
  export let onOpenGroupsChange: ((openGroups: string[]) => void) | undefined = undefined;
  /** Whether following an item closes the drawer. */
  export let closeOnNavigate = true;
  /** Which edge the drawer comes from. Follows the writing direction. */
  export let side: "inline-start" | "inline-end" = "inline-start";
  /** The drawer's accessible name. Falls back to `label`. */
  export let title: string | undefined = undefined;
  /** Whether the drawer renders its own trigger button. */
  export let renderTrigger = true;
  /** Where focus goes when a drawer with no trigger of its own closes. */
  export let returnFocusTo: string | undefined = undefined;

  const holdsCurrent = (section: SidebarSection, current: string | null) =>
    current != null && section.items.some((item) => item.value === current);

  // Resolved once per render: a collapsible section answers to its own id, and
  // a mistake there is loud in development and deterministic in production.
  $: entries = resolveSections(sections);

  // The rail is only offered when every destination shows something without
  // its label. Otherwise it would hide the name and leave an empty control.
  $: railable = canRail(sections);
  $: if (mode === "inline" && collapsed && !railable) {
    fail(
      "a collapsed sidebar needs an icon on every destination: without one a " +
        "destination shows nothing at all once the labels are out of sight",
    );
  }
  $: isRail = mode === "inline" && collapsed && railable;

  $: resolvedLabel = label ?? $t("sidebar.label");
  // The drawer's edge follows the writing direction, so one `side` value is
  // right in both directions.
  const edge = (start: boolean, rtl: boolean): SheetDialogSide =>
    start === rtl ? "right" : "left";
  $: sheetSide = edge(side === "inline-start", $dir === "rtl");

  // The ids this component keeps open. While the application controls the set
  // this copy follows it, so handing `openGroups` back as undefined starts
  // from what is on screen rather than from what the component last held by
  // itself (ADR 0013).
  // Resolved again here rather than read from `entries`: this runs while the
  // component is being set up, before any reactive statement has.
  let ownGroups = resolveSections(sections)
    .filter(
      ({ section }) => section.collapsible && (section.defaultOpen || holdsCurrent(section, value)),
    )
    .map(({ id }) => id);

  // Which collapsible section holds the current destination. It moves when the
  // current destination moves and when the sections themselves change, and
  // both have to open it: a destination nobody can see is the same problem
  // either way.
  $: holderId =
    entries.find(({ section }) => section.collapsible && holdsCurrent(section, value))?.id ?? null;

  // Uncontrolled only: that section opens, silently. Controlled, the
  // application owns the set, so nothing moves and nothing is reported
  // (ADR 0013).
  let lastHolder = holderId;
  $: if (holderId !== lastHolder) {
    lastHolder = holderId;
    if (openGroups === undefined && holderId && !ownGroups.includes(holderId)) {
      ownGroups = [...ownGroups, holderId];
    }
  }

  $: openIds = openGroups ?? ownGroups;
  // While the application controls the set, the component's copy is that set,
  // so handing `openGroups` back continues from what was on screen. Nothing
  // else writes the copy meanwhile, or a set the application refused could
  // surface after the handback.
  $: if (openGroups !== undefined) ownGroups = openGroups;

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

{#if mode === "drawer"}
  <SheetDialog
    {open}
    {renderTrigger}
    {returnFocusTo}
    side={sheetSide}
    title={title ?? resolvedLabel}
    onOpenChange={handleOpenChange}
  >
    <slot name="trigger" slot="trigger">{$t("sidebar.open")}</slot>
    <SidebarNav
      {entries}
      {value}
      {openIds}
      {onSelect}
      label={resolvedLabel}
      hasLogo={Boolean($$slots.logo)}
      hasFooter={Boolean($$slots.footer)}
      mode="drawer"
      {side}
      collapsed={false}
      onNavigate={closeDrawer}
      onPressGroup={pressGroup}
    >
      <slot name="logo" slot="logo" />
      <slot name="footer" slot="footer" />
    </SidebarNav>
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
    hasLogo={Boolean($$slots.logo)}
    hasFooter={Boolean($$slots.footer)}
    mode="inline"
    collapseLabel={$t("sidebar.collapse")}
    expandLabel={$t("sidebar.expand")}
    onToggleCollapsed={onCollapsedChange && railable ? toggleCollapsed : undefined}
    onPressGroup={pressGroup}
  >
    <slot name="logo" slot="logo" />
    <slot name="footer" slot="footer" />
  </SidebarNav>
{/if}
