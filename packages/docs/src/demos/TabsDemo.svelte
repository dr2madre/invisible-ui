<script>
  import Button from "@design-system/svelte/Button.svelte";
  import Icon from "@design-system/svelte/Icon.svelte";
  import Tabs from "@design-system/svelte/Tabs.svelte";

  let views = $state.raw([
    {
      value: "list",
      label: "List",
      icon: "M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01",
      content: "List view.",
    },
    {
      value: "grid",
      label: "Grid",
      icon: "M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z",
      content: "Grid view.",
    },
  ]);
  let view = $state("list");

  // A command, not a tab: it adds a view and selects it, and focus stays on
  // the button so several views can be added in a row.
  function addView() {
    const number = views.length + 1;
    const value = `view-${number}`;
    views = [...views, { value, label: `View ${number}`, content: `View ${number}.` }];
    view = value;
  }
</script>

<div class="demo">
  <!-- Plain text tabs. -->
  <Tabs
    label="Settings"
    value="account"
    items={[
      { value: "account", label: "Account", content: "Manage your account settings." },
      { value: "password", label: "Password", content: "Change your password here." },
      { value: "team", label: "Team", content: "Invite and manage team members." },
    ]}
  />

  <!-- Count-badge variant: the selected tab's badge is violet, the rest grey. -->
  <Tabs
    label="Inbox"
    value="all"
    items={[
      { value: "all", label: "All", count: 24, content: "Every message." },
      { value: "unread", label: "Unread", count: 6, content: "Messages you haven't read." },
      { value: "archived", label: "Archived", count: 0, content: "Archived messages." },
    ]}
  />

  <!-- Icon + label tabs, and an "Add view" command beside the tab list:
       a button in the actions area, never a tab. -->
  <Tabs label="View" bind:value={view} items={views}>
    {#snippet actions()}
      <Button iconOnly variant="ghost" ariaLabel="Add view" onpress={addView}>
        <Icon><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Icon>
      </Button>
    {/snippet}
  </Tabs>
</div>

<style>
  .demo {
    display: grid;
    /* One column that never grows past the page, so a wide tab row scrolls
       inside its own list instead of widening the page at 320px. */
    grid-template-columns: minmax(0, 1fr);
    gap: 2rem;
  }
</style>
