<script lang="ts">
  import Breadcrumb, { type BreadcrumbItem } from "./Breadcrumb.svelte";

  export let items: BreadcrumbItem[] = [
    { label: "Home", href: "/", home: true },
    { label: "Components", href: "/components" },
    { label: "Breadcrumb" },
  ];
</script>

<Breadcrumb {items} />
