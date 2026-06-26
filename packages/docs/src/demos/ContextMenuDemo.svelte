<script>
  import ContextMenu from "@design-system/svelte/ContextMenu.svelte";
</script>

<ContextMenu
  label="Page actions"
  items={[
    { value: "back", label: "Back" },
    { value: "reload", label: "Reload" },
    { value: "save", label: "Save as…", disabled: true },
    { value: "inspect", label: "Inspect" },
  ]}
>
  <div
    style="display:grid; place-items:center; block-size:5rem; border:2px dashed var(--ds-color-border, #cbd5e1); border-radius:0.5rem; color:var(--ds-color-text-secondary, #64748b);"
  >
    Right-click here
  </div>
</ContextMenu>
