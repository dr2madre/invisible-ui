<script>
  import Toolbar from "@design-system/svelte/Toolbar.svelte";
  import ToggleButton from "@design-system/svelte/ToggleButton.svelte";
  import SegmentedControl from "@design-system/svelte/SegmentedControl.svelte";
  import Combobox from "@design-system/svelte/Combobox.svelte";
  import Separator from "@design-system/svelte/Separator.svelte";
  import AlignLeftIcon from "./icons/AlignLeftIcon.svelte";
  import AlignCenterIcon from "./icons/AlignCenterIcon.svelte";
  import AlignRightIcon from "./icons/AlignRightIcon.svelte";

  // Independent on/off toggles (native checkboxes).
  let bold = true;
  let italic = false;
  let underline = false;

  let align = "left";
  const alignItems = [
    { value: "left", label: "Align left", icon: AlignLeftIcon },
    { value: "center", label: "Align center", icon: AlignCenterIcon },
    { value: "right", label: "Align right", icon: AlignRightIcon },
  ];
</script>

<!-- A real toolbar: a toggle group, a segmented control with alignment icons,
     and an icon-led select for the layout. -->
<Toolbar label="Text formatting">
  <ToggleButton label="Bold" pressed={bold} onPressedChange={(p) => (bold = p)}>
    <span style="font-weight: 800;">B</span>
  </ToggleButton>
  <ToggleButton label="Italic" pressed={italic} onPressedChange={(p) => (italic = p)}>
    <span style="font-style: italic; font-family: Georgia, serif;">I</span>
  </ToggleButton>
  <ToggleButton label="Underline" pressed={underline} onPressedChange={(p) => (underline = p)}>
    <span style="text-decoration: underline;">U</span>
  </ToggleButton>

  <Separator orientation="vertical" decorative />

  <SegmentedControl
    label="Alignment"
    iconOnly
    value={align}
    items={alignItems}
    onValueChange={(v) => (align = v)}
  />

  <Separator orientation="vertical" decorative />

  <!-- Advanced select (Combobox without search): per-option layout icons. -->
  <Combobox
    label="Layout"
    searchable={false}
    width="wrap"
    value="single"
    items={[
      { value: "single", label: "Single column", icon: "M6 4h12v16H6z" },
      { value: "two", label: "Two columns", icon: "M4 4h7v16H4z M13 4h7v16h-7z" },
      {
        value: "grid",
        label: "Grid",
        icon: "M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z",
      },
    ]}
  />
</Toolbar>
