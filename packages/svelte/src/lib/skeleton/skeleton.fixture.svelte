<script lang="ts">
  import Skeleton from "./Skeleton.svelte";

  export let variant: "text" | "circle" | "rect" = "text";
  export let lines = 1;
  export let label: string | undefined = undefined;
  export let animation: "pulse" | "wave" | "none" = "pulse";
</script>

<Skeleton {variant} {lines} {label} {animation} width="12rem" />
