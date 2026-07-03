<script lang="ts">
  import Loading from "./Loading.svelte";

  export let variant: "dots" | "spinner" | "bar" | "typing" | "morph" = "dots";
  export let value: number | null = null;
  export let label: string | undefined = undefined;
  export let showLabel = false;
  export let showValue = false;
  export let detail: string | undefined = undefined;
  export let decorative = false;
</script>

<Loading {variant} {value} {label} {showLabel} {showValue} {detail} {decorative} />
