<script lang="ts">
  import CheckboxGroup from "./CheckboxGroup.svelte";

  interface Props {
    value?: string[];
    disabled?: boolean;
    onValueChange?: (value: string[]) => void;
  }

  let { value = [], disabled = false, onValueChange }: Props = $props();
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
