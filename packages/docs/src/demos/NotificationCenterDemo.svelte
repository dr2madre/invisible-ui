<script>
  import SheetDialog from "@design-system/svelte/SheetDialog.svelte";
  import InlineNotification from "@design-system/svelte/InlineNotification.svelte";
  import Button from "@design-system/svelte/Button.svelte";
  import Count from "@design-system/svelte/Count.svelte";
  import Icon from "@design-system/svelte/Icon.svelte";

  // The center holds a HISTORY of notifications (unlike the ephemeral toast).
  // Pure composition: a bell Button + Count badge open a SheetDialog listing
  // InlineNotifications; read/unread and the list live in the application.
  let items = [
    {
      id: 1,
      status: "success",
      title: "Deploy succeeded",
      text: "web-app v2.4.0 is live.",
      time: "2m ago",
      read: false,
    },
    {
      id: 2,
      status: "info",
      title: "New comment",
      text: "Ada commented on your pull request.",
      time: "1h ago",
      read: false,
    },
    {
      id: 3,
      status: "warning",
      title: "Usage at 80%",
      text: "You are nearing your monthly quota.",
      time: "3h ago",
      read: false,
    },
    {
      id: 4,
      status: "neutral",
      title: "Weekly digest",
      text: "5 issues closed, 2 opened.",
      time: "Yesterday",
      read: true,
    },
  ];
  $: unread = items.filter((i) => !i.read).length;

  const markAllRead = () => (items = items.map((i) => ({ ...i, read: true })));
  const dismiss = (id) => (items = items.filter((i) => i.id !== id));
</script>

<SheetDialog side="right" title="Notifications" triggerVariant="ghost">
  <span slot="trigger">
    <span style="position: relative; display: inline-flex;">
      <Icon>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </Icon>
      {#if unread > 0}
        <span style="position: absolute; inset-block-start: -0.5rem; inset-inline-end: -0.5rem;">
          <Count count={unread} label={`${unread} unread notifications`} />
        </span>
      {/if}
    </span>
  </span>

  <svelte:fragment slot="footer">
    <Button variant="ghost" onpress={markAllRead} disabled={unread === 0}>Mark all read</Button>
  </svelte:fragment>

  {#if items.length === 0}
    <p style="color: var(--ds-color-text-secondary);">You're all caught up.</p>
  {:else}
    <ul style="list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem;">
      {#each items as item (item.id)}
        <li
          style="border-radius: var(--ds-radius-surface); background: {item.read
            ? 'transparent'
            : 'var(--ds-color-surface)'};"
        >
          <InlineNotification
            status={item.status}
            title={item.title}
            closable
            closeLabel={`Dismiss ${item.title}`}
            onclose={() => dismiss(item.id)}
          >
            <span style="display: grid; gap: 0.15rem;">
              <span>{item.text}</span>
              <span style="font-size: 0.75rem; color: var(--ds-color-text-secondary);">
                {item.time}
              </span>
            </span>
          </InlineNotification>
        </li>
      {/each}
    </ul>
  {/if}
</SheetDialog>
