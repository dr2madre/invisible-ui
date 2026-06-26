<script>
  import Switch from "@design-system/svelte/Switch.svelte";
</script>

<div style="display: flex; flex-direction: column; gap: 0.5rem;">
  <Switch label="Wi-Fi" checked />
  <Switch label="Bluetooth" />
  <Switch label="Airplane mode" disabled />
</div>
