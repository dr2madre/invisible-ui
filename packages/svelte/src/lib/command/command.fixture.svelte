<script lang="ts">
  import Command from "./Command.svelte";
  import type { CommandItem } from "./create-command";

  export let open = false;
  export let onCommand: ((value: string) => void) | undefined = undefined;
  export let onOpenChange: ((o: boolean) => void) | undefined = undefined;

  export let items: CommandItem[] = [
    { value: "new-file", label: "New File" },
    { value: "open", label: "Open…" },
    { value: "save", label: "Save" },
    { value: "settings", label: "Settings" },
  ];
</script>

<Command {items} {open} {onCommand} {onOpenChange}>
  <span slot="trigger">Open palette</span>
</Command>
