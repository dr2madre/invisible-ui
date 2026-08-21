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
    style="display:grid; place-items:center; block-size:5rem; border:2px dashed var(--ds-color-border, #c7c1b7); border-radius:0.5rem; color:var(--ds-color-text-secondary, #524c44);"
  >
    Right-click here
  </div>
</ContextMenu>
