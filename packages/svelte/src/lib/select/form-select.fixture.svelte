<script lang="ts">
  import Select from "./Select.svelte";

  interface Props {
    value?: string | null;
    name?: string;
  }

  let { value = null, name = "country" }: Props = $props();
</script>

<form data-testid="form">
  <Select
    label="Country"
    {name}
    {value}
    items={[
      { value: "it", label: "Italy" },
      { value: "fr", label: "France" },
    ]}
  />
</form>
