<script>
  import Button from "@design-system/svelte/Button.svelte";
</script>

<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
  <Button>Default</Button>
  <Button variant="primary">Primary</Button>
  <Button variant="secondary">Secondary</Button>
  <Button variant="danger">Destructive</Button>
  <Button variant="ghost">Ghost</Button>
  <Button disabled>Disabled</Button>
</div>
