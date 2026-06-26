<script>
  import NavigationMenu from "@design-system/svelte/NavigationMenu.svelte";
</script>

<NavigationMenu
  label="Main"
  items={[
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
  ]}
/>
