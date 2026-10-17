<script>
  import CheckboxGroup from "@invisible-ui/svelte/CheckboxGroup.svelte";
</script>

<CheckboxGroup
  label="Notifications"
  value={["email"]}
  items={[
    { value: "email", label: "Email" },
    { value: "sms", label: "SMS" },
    { value: "push", label: "Push", disabled: true },
  ]}
/>
