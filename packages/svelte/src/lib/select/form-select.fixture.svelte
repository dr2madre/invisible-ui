<script lang="ts">
  import Select from "./Select.svelte";

  export let value: string | null = null;
  export let name = "country";
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
