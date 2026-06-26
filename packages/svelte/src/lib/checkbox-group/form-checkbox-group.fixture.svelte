<script lang="ts">
  import CheckboxGroup from "./CheckboxGroup.svelte";

  export let value: string[] = [];
  export let name = "notifications";
</script>

<form data-testid="form">
  <CheckboxGroup
    label="Notifications"
    {name}
    {value}
    items={[
      { value: "email", label: "Email" },
      { value: "sms", label: "SMS" },
      { value: "push", label: "Push" },
    ]}
  />
</form>
