<script>
  import ToggleGroup from "@design-system/svelte/ToggleGroup.svelte";
  let value = ["bold"];
  const items = [
    { value: "bold", label: "Bold" },
    { value: "italic", label: "Italic" },
    { value: "underline", label: "Underline" },
  ];
</script>

<ToggleGroup
  {items}
  {value}
  type="multiple"
  label="Text formatting"
  onValueChange={(v) => (value = v)}
/>
