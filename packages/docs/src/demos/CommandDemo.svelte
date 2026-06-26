<script>
  import Command from "@design-system/svelte/Command.svelte";
</script>

<Command
  items={[
    { value: "new", label: "New File" },
    { value: "open", label: "Open…" },
    { value: "save", label: "Save" },
    { value: "settings", label: "Settings" },
  ]}
>
  <span slot="trigger">Open command palette</span>
</Command>
