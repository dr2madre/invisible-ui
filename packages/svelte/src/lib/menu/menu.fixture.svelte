<script lang="ts">
  import Menu, { type MenuSection } from "./Menu.svelte";

  export let value: string | null = "home";
  export let onSelect: ((value: string) => void) | undefined = undefined;

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

<Menu {sections} {value} {onSelect} />
