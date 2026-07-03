<script>
  import Toolbar from "@design-system/svelte/Toolbar.svelte";
  import ToggleGroup from "@design-system/svelte/ToggleGroup.svelte";
  import SegmentedControl from "@design-system/svelte/SegmentedControl.svelte";
  import Combobox from "@design-system/svelte/Combobox.svelte";
  import Separator from "@design-system/svelte/Separator.svelte";
  import AlignLeftIcon from "./icons/AlignLeftIcon.svelte";
  import AlignCenterIcon from "./icons/AlignCenterIcon.svelte";
  import AlignRightIcon from "./icons/AlignRightIcon.svelte";

  let format = ["bold"];
  const formatItems = [
    { value: "bold", label: "Bold" },
    { value: "italic", label: "Italic" },
    { value: "underline", label: "Underline" },
  ];

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
  <ToggleGroup
    items={formatItems}
    value={format}
    type="multiple"
    label="Text style"
    onValueChange={(v) => (format = v)}
  >
    <svelte:fragment slot="item" let:item>
      {#if item.value === "bold"}
        <span style="font-weight: 800;">B</span>
      {:else if item.value === "italic"}
        <span style="font-style: italic; font-family: Georgia, serif;">I</span>
      {:else}
        <span style="text-decoration: underline;">U</span>
      {/if}
    </svelte:fragment>
  </ToggleGroup>

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
