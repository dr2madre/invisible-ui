<script>
  import Breadcrumb from "@design-system/svelte/Breadcrumb.svelte";

  const items = [
    { label: "Home", href: "/", home: true },
    { label: "Components", href: "/components" },
    { label: "Navigation", href: "/components#navigation" },
    { label: "Breadcrumb" },
  ];
</script>

<Breadcrumb {items} />
