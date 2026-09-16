<script lang="ts" context="module">
  import type { SidebarItem, SidebarSection } from "../sidebar/types";

  /** @deprecated Renamed to `SidebarItem`. Kept until the removal (ADR 0013). */
  export type MenuItem = SidebarItem;
  /** @deprecated Renamed to `SidebarSection`. Kept until the removal (ADR 0013). */
  export type MenuSection = SidebarSection;
</script>

<script lang="ts">
  /**
   * @deprecated Renamed to `Sidebar` (ADR 0013): this name belongs to the
   * WAI-ARIA menu family, which Dropdown Menu, Context Menu and Menubar build
   * on, and which this component never used. Import
   * `@design-system/svelte/Sidebar.svelte` instead. Everything here keeps
   * working until the removal: the same props, the same slots, the same
   * markup, and `--ds-menu-*` still themes it.
   */
  import Sidebar from "../sidebar/Sidebar.svelte";

  /** Groups of items, rendered in order with an optional heading each. */
  export let sections: MenuSection[];
  /** The active item's value. */
  export let value: string | null = null;
  /** Accessible name for the navigation landmark. Defaults to the catalog's "Main". */
  export let label: string | undefined = undefined;
  export let onSelect: ((value: string) => void) | undefined = undefined;
</script>

<Sidebar {sections} {value} {label} {onSelect}>
  <slot name="logo" slot="logo" />
  <slot name="footer" slot="footer" />
</Sidebar>
