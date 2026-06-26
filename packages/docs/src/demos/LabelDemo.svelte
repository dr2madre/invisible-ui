<script>
  import Label from "@design-system/svelte/Label.svelte";
</script>

<div style="display: flex; flex-direction: column; gap: 0.35rem;">
  <Label for="demo-name" required>Full name</Label>
  <input
    id="demo-name"
    type="text"
    placeholder="Ada Lovelace"
    style="padding: 0.5rem 0.6rem; border: 1px solid var(--ds-color-border, #cbd5e1); border-radius: 0.5rem; font: inherit;"
  />
</div>
