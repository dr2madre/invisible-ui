<script>
  import ContextMenu from "@nozcadesign/invisible-ui-svelte/ContextMenu.svelte";
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
    style="display:grid; place-items:center; block-size:5rem; border:2px dashed var(--iui-components-general-border-default, #bdbdbd); border-radius:0.5rem; color:var(--iui-components-general-foreground-secondary, #515151);"
  >
    Right-click here
  </div>
</ContextMenu>
