<script lang="ts">
  import Link from "./Link.svelte";

  export let href = "/guide";
  export let external = false;
  export let variant: "primary" | "subtle" = "primary";
  export let onclick: ((event: MouseEvent) => void) | undefined = undefined;
  export let label = "Read the guide";
</script>

<Link {href} {external} {variant} on:click={(event) => onclick?.(event)}>{label}</Link>
