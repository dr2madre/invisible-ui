<script lang="ts">
  import RadioGroup from "./RadioGroup.svelte";

  export let value: string | null = null;
  export let name = "plan";
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
