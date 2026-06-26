<script>
  import Tabs from "@design-system/svelte/Tabs.svelte";
</script>

<Tabs
  label="Settings"
  value="account"
  items={[
    { value: "account", label: "Account", content: "Manage your account settings." },
    { value: "password", label: "Password", content: "Change your password here." },
    { value: "team", label: "Team", content: "Invite and manage team members." },
  ]}
/>
