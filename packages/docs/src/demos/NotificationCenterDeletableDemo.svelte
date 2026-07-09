<script>
  import SheetDialog from "@design-system/svelte/SheetDialog.svelte";
  import InlineNotification from "@design-system/svelte/InlineNotification.svelte";
  import Button from "@design-system/svelte/Button.svelte";
  import Count from "@design-system/svelte/Count.svelte";
  import Icon from "@design-system/svelte/Icon.svelte";

  // A deletable variant: the same calm, uncolored rows, but each can be
  // removed (✕) and the header clears all. No read/unread dot here — the
  // model is "dismiss when handled" rather than "mark read".
  const ICONS = {
    deploys: "M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01l-3-3",
    mentions:
      "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z",
    system: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z M12 8v4 M12 16h.01",
  };
  let items = [
    {
      id: 1,
      topic: "deploys",
      title: "Deploy succeeded",
      text: "web-app v2.4.0 is live.",
      time: "9:41",
    },
    {
      id: 2,
      topic: "mentions",
      title: "New comment",
      text: "Ada mentioned you on PR #128.",
      time: "8:12",
    },
    {
      id: 3,
      topic: "system",
      title: "Weekly digest",
      text: "5 issues closed, 2 opened.",
      time: "Mon",
    },
  ];
  const remove = (id) => (items = items.filter((i) => i.id !== id));
  const clearAll = () => (items = []);
</script>

<SheetDialog side="right" title="Notifications" triggerVariant="ghost">
  <span slot="trigger">
    <span style="position: relative; display: inline-flex;">
      <Icon>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </Icon>
      {#if items.length > 0}
        <span style="position: absolute; inset-block-start: -0.5rem; inset-inline-end: -0.5rem;">
          <Count count={items.length} label={`${items.length} notifications`} />
        </span>
      {/if}
    </span>
  </span>

  <svelte:fragment slot="headerActions">
    <Button variant="ghost" onpress={clearAll} disabled={items.length === 0}>Clear all</Button>
  </svelte:fragment>

  {#if items.length === 0}
    <p style="color: var(--ds-color-text-secondary);">No notifications.</p>
  {:else}
    <div style="display: grid; gap: 0.25rem;">
      {#each items as item (item.id)}
        <InlineNotification
          plain
          status="neutral"
          iconBox="transparent"
          title={item.title}
          closable
          closeLabel={`Delete “${item.title}”`}
          onclose={() => remove(item.id)}
        >
          <Icon slot="icon"><path d={ICONS[item.topic]} /></Icon>
          <span style="display: grid; gap: 0.15rem;">
            <span>{item.text}</span>
            <span style="font-size: 0.75rem; color: var(--ds-color-text-secondary);"
              >{item.time}</span
            >
          </span>
        </InlineNotification>
      {/each}
    </div>
  {/if}
</SheetDialog>

<style>
  :global(.sheet-dialog__panel[data-side="right"]) {
    --ds-sheet-dialog-size: 26rem;
  }
</style>
