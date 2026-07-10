<script>
  import SheetDialog from "@design-system/svelte/SheetDialog.svelte";
  import InlineNotification from "@design-system/svelte/InlineNotification.svelte";
  import Button from "@design-system/svelte/Button.svelte";
  import Count from "@design-system/svelte/Count.svelte";
  import Icon from "@design-system/svelte/Icon.svelte";
  import TextField from "@design-system/svelte/TextField.svelte";
  import ToggleButton from "@design-system/svelte/ToggleButton.svelte";
  import ToggleGroup from "@design-system/svelte/ToggleGroup.svelte";
  import Switch from "@design-system/svelte/Switch.svelte";
  import { SvelteSet } from "svelte/reactivity";

  // Each notification TYPE carries its own icon (glyph path) — set per topic,
  // not per status, so the center reads as one calm, uncolored list.
  const TOPICS = [
    {
      id: "deploys",
      label: "Deploys",
      icon: "M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01l-3-3",
    },
    {
      id: "mentions",
      label: "Mentions",
      icon: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z",
    },
    { id: "billing", label: "Billing", icon: "M1 4h22v16H1z M1 10h22" },
    {
      id: "system",
      label: "System",
      icon: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z M12 8v4 M12 16h.01",
    },
  ];
  const iconOf = (topic) => TOPICS.find((t) => t.id === topic)?.icon ?? "";

  let items = [
    {
      id: 1,
      topic: "deploys",
      title: "Deploy succeeded",
      text: "web-app v2.4.0 is live.",
      time: "9:41",
      when: "today",
      read: false,
    },
    {
      id: 2,
      topic: "mentions",
      title: "New comment",
      text: "Ada mentioned you on PR #128.",
      time: "8:12",
      when: "today",
      read: false,
    },
    {
      id: 3,
      topic: "billing",
      title: "Usage at 80%",
      text: "Nearing your monthly quota.",
      time: "16:30",
      when: "yesterday",
      read: false,
    },
    {
      id: 4,
      topic: "deploys",
      title: "Deploy rolled back",
      text: "api v2.3.9 was reverted.",
      time: "11:05",
      when: "yesterday",
      read: true,
    },
    {
      id: 5,
      topic: "system",
      title: "Weekly digest",
      text: "5 issues closed, 2 opened.",
      time: "Mon",
      when: "week",
      read: true,
    },
  ];

  let enabled = Object.fromEntries(TOPICS.map((t) => [t.id, true]));
  const activeChips = new SvelteSet();
  let query = "";
  let showSettings = false;

  const toggleChip = (id, on) => {
    if (on) activeChips.add(id);
    else activeChips.delete(id);
  };

  $: visible = items.filter(
    (i) =>
      enabled[i.topic] &&
      (activeChips.size === 0 || activeChips.has(i.topic)) &&
      (query === "" || (i.title + " " + i.text).toLowerCase().includes(query.toLowerCase())),
  );
  $: unread = items.filter((i) => !i.read && enabled[i.topic]).length;
  const SECTIONS = [
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "week", label: "This week" },
  ];
  $: bySection = SECTIONS.map((s) => ({
    ...s,
    rows: visible.filter((i) => i.when === s.key),
  })).filter((s) => s.rows.length > 0);

  const markAllRead = () => (items = items.map((i) => ({ ...i, read: true })));
  // Notifications are not deleted — only marked read.
  const markRead = (id) => (items = items.map((i) => (i.id === id ? { ...i, read: true } : i)));
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

  <svelte:fragment slot="headerActions">
    <Button
      variant="ghost"
      iconOnly
      ariaLabel={showSettings ? "Back to notifications" : "Notification settings"}
      onpress={() => (showSettings = !showSettings)}
    >
      {#if showSettings}
        <Icon><path d="M19 12H5m7-7-7 7 7 7" /></Icon>
      {:else}
        <Icon>
          <circle cx="12" cy="12" r="3" />
          <path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
          />
        </Icon>
      {/if}
    </Button>
    {#if !showSettings}
      <Button variant="ghost" onpress={markAllRead} disabled={unread === 0}>Mark all read</Button>
    {/if}
  </svelte:fragment>

  {#if showSettings}
    <div style="display: grid; gap: 0.75rem;">
      <p style="margin: 0; color: var(--ds-color-text-secondary); font-size: 0.875rem;">
        Choose which notifications you receive.
      </p>
      {#each TOPICS as topic (topic.id)}
        <Switch
          label={topic.label}
          checked={enabled[topic.id]}
          onCheckedChange={(c) => (enabled = { ...enabled, [topic.id]: c })}
        />
      {/each}
    </div>
  {:else}
    <div style="display: grid; gap: 1rem;">
      <TextField label="Search notifications" hideLabel placeholder="Search…" bind:value={query} />

      <ToggleGroup label="Filter by topic" wrap>
        {#each TOPICS.filter((t) => enabled[t.id]) as topic (topic.id)}
          <ToggleButton
            check
            pressed={activeChips.has(topic.id)}
            onPressedChange={(on) => toggleChip(topic.id, on)}
          >
            {topic.label}
          </ToggleButton>
        {/each}
      </ToggleGroup>

      {#if bySection.length === 0}
        <p style="color: var(--ds-color-text-secondary);">Nothing to show.</p>
      {:else}
        {#each bySection as section (section.key)}
          <section style="display: grid; gap: 0.25rem;">
            <h3 class="nc-section">{section.label}</h3>
            {#each section.rows as item (item.id)}
              <div class="nc-row">
                <InlineNotification plain status="neutral" iconBox="transparent" title={item.title}>
                  <Icon slot="icon"><path d={iconOf(item.topic)} /></Icon>
                  <span style="display: grid; gap: 0.15rem;">
                    <span>{item.text}</span>
                    <span style="font-size: 0.75rem; color: var(--ds-color-text-secondary);">
                      {item.time}
                    </span>
                  </span>
                </InlineNotification>
                {#if !item.read}
                  <!-- Read/unread dot; press to mark this one read. Nothing is deleted. -->
                  <button
                    type="button"
                    class="nc-dot"
                    aria-label={`Mark “${item.title}” as read`}
                    on:click={() => markRead(item.id)}
                  ></button>
                {/if}
              </div>
            {/each}
          </section>
        {/each}
      {/if}
    </div>
  {/if}
</SheetDialog>

<style>
  /* A roomier panel than the default — a history list wants width. */
  :global(.sheet-dialog__panel[data-side="right"]) {
    --ds-sheet-dialog-size: 26rem;
  }
  .nc-section {
    margin: 0.25rem 0 0;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ds-color-text-secondary);
  }
  /* Rows carry no surface, border or status color — only outer spacing sets
     them apart. Read and unread rows look identical; the only difference is
     the dot's presence. */
  .nc-row {
    position: relative;
    padding-inline-end: 1rem;
  }
  /* Unread dot (red), top-right; press marks the item read. */
  .nc-dot {
    position: absolute;
    inset-block-start: 1.15rem;
    inset-inline-end: 0.25rem;
    inline-size: 0.5rem;
    block-size: 0.5rem;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: var(--ds-color-danger, #dc2626);
    cursor: pointer;
  }
  .nc-dot:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
  }
</style>
