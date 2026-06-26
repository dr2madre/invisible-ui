<script lang="ts">
  import { createSwitch } from "./create-switch";

  export let checked = false;
  export let disabled = false;
  export let onCheckedChange: ((c: boolean) => void) | undefined = undefined;

  const { state: swState, setChecked } = createSwitch({ checked, disabled, onCheckedChange });

  function onChange(event: Event) {
    setChecked((event.currentTarget as HTMLInputElement).checked);
  }
</script>

<input
  type="checkbox"
  role="switch"
  aria-label="Wi-Fi"
  {disabled}
  checked={$swState.checked}
  on:change={onChange}
  data-state={$swState.checked ? "checked" : "unchecked"}
/>
