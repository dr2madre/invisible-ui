<script lang="ts">
  import Breadcrumb, { type BreadcrumbItem } from "./Breadcrumb.svelte";

  interface Props {
    items?: BreadcrumbItem[];
  }

  let {
    items = [
      { label: "Home", href: "/", home: true },
      { label: "Components", href: "/components" },
      { label: "Breadcrumb" },
    ],
  }: Props = $props();
</script>

<Breadcrumb {items} />
