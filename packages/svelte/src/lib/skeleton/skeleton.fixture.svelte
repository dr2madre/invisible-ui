<script lang="ts">
  import Skeleton from "./Skeleton.svelte";

  interface Props {
    variant?: "text" | "circle" | "rect";
    lines?: number;
    label?: string;
    animation?: "pulse" | "wave" | "none";
  }

  let { variant = "text", lines = 1, label, animation = "pulse" }: Props = $props();
</script>

<Skeleton {variant} {lines} {label} {animation} width="12rem" />
