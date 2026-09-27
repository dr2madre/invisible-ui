<script lang="ts">
  import LoadingGenerationArea from "./LoadingGenerationArea.svelte";

  interface Props {
    label?: string;
    decorative?: boolean;
    loading?: boolean;
    field?: boolean;
    labelPosition?: "center" | "top" | "bottom" | "left" | "right";
    status?: string;
    value?: number | null;
    detail?: string;
  }

  let {
    label,
    decorative = false,
    loading = true,
    field = true,
    labelPosition = "center",
    status,
    value = null,
    detail,
  }: Props = $props();
</script>

<LoadingGenerationArea
  {label}
  {decorative}
  {loading}
  {field}
  {labelPosition}
  {status}
  {value}
  {detail}
>
  <p>Loaded content</p>
</LoadingGenerationArea>
