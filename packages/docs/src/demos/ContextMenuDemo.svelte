<script>
  import ContextMenu from "@invisible-ui/svelte/ContextMenu.svelte";
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
    style="display:grid; place-items:center; block-size:5rem; border:2px dashed var(--ds-components-general-border-default, #bdbdbd); border-radius:0.5rem; color:var(--ds-components-general-foreground-secondary, #515151);"
  >
    Right-click here
  </div>
</ContextMenu>
