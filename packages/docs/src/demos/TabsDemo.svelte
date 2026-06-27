<script>
  import Tabs from "@design-system/svelte/Tabs.svelte";
</script>

<div style="display: flex; flex-direction: column; gap: 2rem;">
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

  <!-- Icon + label, and an icon-only tab (the label is the accessible name). -->
  <Tabs
    label="View"
    value="list"
    items={[
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
      {
        value: "add",
        label: "Add view",
        icon: "M12 5v14 M5 12h14",
        iconOnly: true,
        content: "Add a new view.",
      },
    ]}
  />
</div>
