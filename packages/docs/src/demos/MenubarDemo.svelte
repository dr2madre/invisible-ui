<script>
  import Menubar from "@design-system/svelte/Menubar.svelte";
</script>

<Menubar
  label="Main"
  menus={[
    {
      value: "file",
      label: "File",
      items: [
        { value: "new", label: "New" },
        { value: "open", label: "Open" },
        { value: "save", label: "Save", disabled: true },
      ],
    },
    {
      value: "edit",
      label: "Edit",
      items: [
        { value: "undo", label: "Undo" },
        { value: "redo", label: "Redo" },
      ],
    },
    {
      value: "view",
      label: "View",
      items: [
        { value: "zoom-in", label: "Zoom in" },
        { value: "zoom-out", label: "Zoom out" },
      ],
    },
  ]}
/>
