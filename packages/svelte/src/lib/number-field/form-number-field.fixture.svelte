<script lang="ts">
  import NumberField from "./NumberField.svelte";

  export let disabled = false;
</script>

<form data-testid="form">
  <NumberField label="Amount" name="amount" value={1234.5} locale="it-IT" step={0.5} {disabled} />
  <button type="reset">Reset</button>
</form>
<NumberField label="Outside" name="outside" form="owner-form" value={2} />
<form id="owner-form" data-testid="owner-form"></form>
