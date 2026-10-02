<script lang="ts">
  import Menubar from "./Menubar.svelte";
  import type { MenubarMenu } from "./create-menubar";

  interface Props {
    onSelect?: (menuValue: string, itemValue: string) => void;
    menus?: MenubarMenu[];
  }

  let {
    onSelect,
    menus = [
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
    ],
  }: Props = $props();
</script>

<Menubar label="Main" {menus} {onSelect} />
