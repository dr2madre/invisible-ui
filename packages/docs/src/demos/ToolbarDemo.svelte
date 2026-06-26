<script>
  import Toolbar from "@design-system/svelte/Toolbar.svelte";
  import ToggleButton from "@design-system/svelte/ToggleButton.svelte";
  import Separator from "@design-system/svelte/Separator.svelte";
</script>

<Toolbar label="Text formatting">
  <ToggleButton label="Bold" pressed><strong>B</strong></ToggleButton>
  <ToggleButton label="Italic"><em>I</em></ToggleButton>
  <ToggleButton label="Underline"><u>U</u></ToggleButton>
  <Separator orientation="vertical" decorative />
  <ToggleButton label="Align left">L</ToggleButton>
  <ToggleButton label="Align center">C</ToggleButton>
</Toolbar>
