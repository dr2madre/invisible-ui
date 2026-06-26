<script lang="ts">
  import CheckboxGroup from "./CheckboxGroup.svelte";

  export let value: string[] = [];
  export let disabled = false;
  export let onValueChange: ((value: string[]) => void) | undefined = undefined;
</script>

<CheckboxGroup
  label="Notifications"
  {value}
  {disabled}
  {onValueChange}
  items={[
    { value: "email", label: "Email" },
    { value: "sms", label: "SMS", disabled: true },
    { value: "push", label: "Push" },
  ]}
/>
