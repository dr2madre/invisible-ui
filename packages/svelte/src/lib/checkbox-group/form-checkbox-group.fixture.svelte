<script lang="ts">
  import CheckboxGroup from "./CheckboxGroup.svelte";

  interface Props {
    value?: string[];
    name?: string;
  }

  let { value = [], name = "notifications" }: Props = $props();
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
