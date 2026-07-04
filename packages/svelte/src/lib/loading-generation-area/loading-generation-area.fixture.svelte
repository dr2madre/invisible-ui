<script lang="ts">
  import LoadingGenerationArea from "./LoadingGenerationArea.svelte";

  export let label: string | undefined = undefined;
  export let decorative = false;
  export let loading = true;
  export let field = true;
  export let labelPosition: "center" | "top" | "bottom" | "left" | "right" = "center";
  export let status: string | undefined = undefined;
  export let value: number | null = null;
  export let detail: string | undefined = undefined;
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
