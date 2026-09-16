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
  /** Given, the rail toggle is rendered and reports every press. */
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

  const sectionId = (section: SidebarSection, index: number) =>
    section.id ?? section.label ?? String(index);
  const holdsCurrent = (section: SidebarSection, current: string | null) =>
    current != null && section.items.some((item) => item.value === current);

  $: resolvedLabel = label ?? $t("sidebar.label");
  // The drawer's edge follows the writing direction, so one `side` value is
  // right in both directions.
  const edge = (start: boolean, rtl: boolean): SheetDialogSide =>
    start === rtl ? "right" : "left";
  $: sheetSide = edge(side === "inline-start", $dir === "rtl");

  // The ids this component keeps open while the consumer is not controlling
  // them.
  let ownGroups = sections
    .map((section, index) => ({ section, id: sectionId(section, index) }))
    .filter(
      ({ section }) => section.collapsible && (section.defaultOpen || holdsCurrent(section, value)),
    )
    .map(({ id }) => id);

  // Uncontrolled only: the section holding the current item opens whenever the
  // current item moves. Controlled, the application owns the set, so a change
  // of `value` moves nothing and reports nothing (ADR 0013).
  let lastValue = value;
  $: if (openGroups === undefined && value !== lastValue) {
    lastValue = value;
    const holder = sections
      .map((section, index) => ({ section, id: sectionId(section, index) }))
      .find(({ section }) => section.collapsible && holdsCurrent(section, value));
    if (holder && !ownGroups.includes(holder.id)) ownGroups = [...ownGroups, holder.id];
  }

  $: openIds = openGroups ?? ownGroups;

  const toggleGroup = (id: string) => {
    const next = openIds.includes(id) ? openIds.filter((open) => open !== id) : [...openIds, id];
    if (openGroups === undefined) ownGroups = next;
    onOpenGroupsChange?.(next);
  };

  const pressGroup = (id: string) => {
    // Pressing a section while the rail is collapsed opens the bar first: its
    // items would otherwise expand into a column too narrow to read them.
    if (collapsed) {
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
      {sections}
      {value}
      {sectionId}
      {openIds}
      {onSelect}
      label={resolvedLabel}
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
    {sections}
    {value}
    {sectionId}
    {openIds}
    {onSelect}
    {collapsed}
    {side}
    label={resolvedLabel}
    mode="inline"
    collapseLabel={$t("sidebar.collapse")}
    expandLabel={$t("sidebar.expand")}
    onToggleCollapsed={onCollapsedChange ? toggleCollapsed : undefined}
    onPressGroup={pressGroup}
  >
    <slot name="logo" slot="logo" />
    <slot name="footer" slot="footer" />
  </SidebarNav>
{/if}
