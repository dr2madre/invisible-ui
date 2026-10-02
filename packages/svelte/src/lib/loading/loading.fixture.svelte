<script lang="ts">
  import Loading from "./Loading.svelte";

  interface Props {
    variant?: "dots" | "spinner" | "bar" | "typing" | "morph";
    value?: number | null;
    label?: string;
    showLabel?: boolean;
    showValue?: boolean;
    detail?: string;
    status?: string;
    decorative?: boolean;
  }

  let {
    variant = "dots",
    value = null,
    label,
    showLabel = false,
    showValue = false,
    detail,
    status,
    decorative = false,
  }: Props = $props();
</script>

<Loading {variant} {value} {label} {showLabel} {showValue} {detail} {status} {decorative} />
