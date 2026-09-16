<script lang="ts">
  import Menu, { type MenuSection } from "./Menu.svelte";

  export let value: string | null = "home";
  export let onSelect: ((value: string) => void) | undefined = undefined;
  export let withSlots = false;

  const sections: MenuSection[] = [
    {
      label: "Main",
      items: [
        { value: "home", label: "Home" },
        { value: "search", label: "Search" },
        { value: "alerts", label: "Alerts" },
      ],
    },
    { label: "More", items: [{ value: "settings", label: "Settings" }] },
  ];
</script>

{#if withSlots}
  <Menu {sections} {value} {onSelect}>
    <span slot="logo">Brand</span>
    <span slot="footer">Signed in</span>
  </Menu>
{:else}
  <Menu {sections} {value} {onSelect} />
{/if}
