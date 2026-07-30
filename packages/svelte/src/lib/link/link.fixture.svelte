<script lang="ts">
  import Link from "./Link.svelte";

  export let href: string | undefined = undefined;
  export let external = false;
  export let variant: "primary" | "subtle" = "primary";
  export let onpress: ((event: MouseEvent) => void) | undefined = undefined;
  export let label = "Read the guide";
</script>

<Link {href} {external} {variant} {onpress}>{label}</Link>
