<script lang="ts">
  import NavigationMenu from "./NavigationMenu.svelte";
  import type { NavigationMenuItem } from "./create-navigation-menu";

  interface Props {
    dropLast?: boolean;
  }

  let { dropLast = false }: Props = $props();

  const all: NavigationMenuItem[] = [
    {
      value: "products",
      label: "Products",
      links: [{ label: "Analytics", href: "#analytics" }],
    },
    {
      value: "company",
      label: "Company",
      links: [{ label: "About", href: "#about" }],
    },
  ];
  const items = $derived(dropLast ? all.slice(0, 1) : all);
</script>

<NavigationMenu label="Main" {items} />
