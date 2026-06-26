<script lang="ts">
  import Toolbar from "./Toolbar.svelte";
  import ToggleButton from "../toggle-button/ToggleButton.svelte";
  import Separator from "../separator/Separator.svelte";
</script>

<Toolbar label="Text formatting">
  <ToggleButton label="Bold">B</ToggleButton>
  <ToggleButton label="Italic">I</ToggleButton>
  <Separator orientation="vertical" decorative />
  <ToggleButton label="Align left">L</ToggleButton>
</Toolbar>
