<script>
  import Checkbox from "@design-system/svelte/Checkbox.svelte";
</script>

<div style="display: flex; flex-direction: column; gap: 0.5rem;">
  <Checkbox label="Accept terms" checked />
  <Checkbox label="Subscribe to the newsletter" />
  <Checkbox label="Select all" checked="indeterminate" />
</div>
