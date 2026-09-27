<script lang="ts">
  import Toolbar from "./Toolbar.svelte";
  import ToggleButton from "../toggle-button/ToggleButton.svelte";

  interface Props {
    italicDisabled?: boolean;
  }

  let { italicDisabled = false }: Props = $props();
</script>

<Toolbar label="Text formatting">
  <ToggleButton label="Bold">B</ToggleButton>
  <ToggleButton label="Italic" disabled={italicDisabled}>I</ToggleButton>
  <ToggleButton label="Align left">L</ToggleButton>
</Toolbar>
