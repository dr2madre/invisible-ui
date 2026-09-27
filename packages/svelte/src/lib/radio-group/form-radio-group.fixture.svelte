<script lang="ts">
  import RadioGroup from "./RadioGroup.svelte";

  interface Props {
    value?: string | null;
    name?: string;
  }

  let { value = null, name = "plan" }: Props = $props();
</script>

<form data-testid="form">
  <RadioGroup
    label="Plan"
    {name}
    {value}
    items={[
      { value: "free", label: "Free" },
      { value: "pro", label: "Pro" },
    ]}
  />
</form>
