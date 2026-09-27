<script lang="ts">
  import { untrack } from "svelte";
  import { createProgress } from "./create-progress";

  interface Props {
    value?: number | null;
    min?: number;
    max?: number;
  }

  let { value = 0, min = 0, max = 100 }: Props = $props();

  const { rootAction, indicatorAction } = untrack(() => createProgress({ value, min, max }));
</script>

<div use:rootAction aria-label="Upload progress">
  <div use:indicatorAction></div>
</div>
