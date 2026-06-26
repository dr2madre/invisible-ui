<script lang="ts">
  import { createProgress } from "./create-progress";

  export let value: number | null = 0;
  export let min = 0;
  export let max = 100;

  const { rootAction, indicatorAction } = createProgress({ value, min, max });
</script>

<div use:rootAction aria-label="Upload progress">
  <div use:indicatorAction></div>
</div>
