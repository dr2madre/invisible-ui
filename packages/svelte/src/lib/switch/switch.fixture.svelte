<script lang="ts">
  import { untrack } from "svelte";
  import { createSwitch } from "./create-switch";

  interface Props {
    checked?: boolean;
    disabled?: boolean;
    onCheckedChange?: (c: boolean) => void;
  }

  let { checked = false, disabled = false, onCheckedChange }: Props = $props();

  const { state: swState, setChecked } = untrack(() =>
    createSwitch({ checked, disabled, onCheckedChange }),
  );

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
  onchange={onChange}
  data-state={$swState.checked ? "checked" : "unchecked"}
/>
