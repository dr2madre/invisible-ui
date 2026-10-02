<script lang="ts">
  import Link from "./Link.svelte";

  interface Props {
    href?: string;
    external?: boolean;
    variant?: "primary" | "subtle";
    onclick?: (event: MouseEvent) => void;
    label?: string;
    target?: string;
  }

  let {
    href = "/guide",
    external = false,
    variant = "primary",
    onclick,
    label = "Read the guide",
    target,
  }: Props = $props();
</script>

<Link {href} {external} {variant} {target} onclick={(event) => onclick?.(event)}>{label}</Link>
