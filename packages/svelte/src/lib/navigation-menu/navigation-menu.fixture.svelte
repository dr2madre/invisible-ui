<script lang="ts">
  import NavigationMenu from "./NavigationMenu.svelte";
  import type { NavigationMenuItem } from "./create-navigation-menu";

  export let onValueChange: ((value: string | null) => void) | undefined = undefined;

  const items: NavigationMenuItem[] = [
    {
      value: "products",
      label: "Products",
      links: [
        { label: "Analytics", href: "#analytics", description: "Understand your traffic." },
        { label: "Automation", href: "#automation", description: "Automate your workflow." },
      ],
    },
    {
      value: "company",
      label: "Company",
      links: [
        { label: "About", href: "#about" },
        { label: "Careers", href: "#careers" },
      ],
    },
    { value: "pricing", label: "Pricing", href: "#pricing" },
  ];
</script>

<NavigationMenu label="Main" {items} {onValueChange} />
