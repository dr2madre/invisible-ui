<script>
  import ToggleGroup from "@design-system/svelte/ToggleGroup.svelte";
  import ToggleButton from "@design-system/svelte/ToggleButton.svelte";

  // Each toggle is independent (its own on/off state). The group is only a
  // visual wrapper; `label` names the container for screen readers.
  let bold = true;
  let italic = false;
  let underline = false;
</script>

<ToggleGroup label="Text formatting">
  <ToggleButton label="Bold" pressed={bold} onPressedChange={(p) => (bold = p)}>
    <span style="font-weight: 800;">B</span>
  </ToggleButton>
  <ToggleButton label="Italic" pressed={italic} onPressedChange={(p) => (italic = p)}>
    <span style="font-style: italic; font-family: Georgia, serif;">I</span>
  </ToggleButton>
  <ToggleButton label="Underline" pressed={underline} onPressedChange={(p) => (underline = p)}>
    <span style="text-decoration: underline;">U</span>
  </ToggleButton>
</ToggleGroup>
