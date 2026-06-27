<script>
  import Kbd from "@design-system/svelte/Kbd.svelte";
</script>

<div style="display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
  <span>Press <Kbd>Esc</Kbd> to close</span>
  <span>Open search with <Kbd keys={["⌘", "K"]} /></span>
  <span>Save: <Kbd keys={["Ctrl", "S"]} /></span>
</div>
