<script>
  import SearchDialog from "@design-system/svelte/SearchDialog.svelte";

  let open = false;
  let chosen = "";

  // `group` sections the results by type — ungrouped items come first.
  const items = [
    { value: "help", label: "Help" },
    { value: "home", label: "Home", group: "Pages" },
    { value: "settings", label: "Settings", group: "Pages" },
    { value: "new", label: "New File", group: "Actions", shortcut: ["⌘", "N"] },
    { value: "open", label: "Open…", group: "Actions", shortcut: ["⌘", "O"] },
    { value: "save", label: "Save", group: "Actions" },
  ];

  // The shortcut belongs to the application, not the component: this demo
  // picks ⌘S / Ctrl+S ("S" for search) and binds `open`.
  const onKeydown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      open = true;
    }
  };
</script>

<svelte:window on:keydown={onKeydown} />

<div style="display: grid; gap: 0.5rem; justify-items: start;">
  <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
    <SearchDialog {items} bind:open onSelect={(value) => (chosen = value)}>
      <span slot="trigger">Search…</span>
    </SearchDialog>
    {#if chosen}
      <span style="font-size: 0.875rem; color: var(--ds-color-text-secondary);">
        Selected: “{chosen}”.
      </span>
    {/if}
  </div>
  <span style="font-size: 0.8125rem; color: var(--ds-color-text-secondary);">
    Also opens with <kbd>⌘S</kbd> / <kbd>Ctrl+S</kbd> — the shortcut is wired by the demo, not built into
    the component.
  </span>
</div>
