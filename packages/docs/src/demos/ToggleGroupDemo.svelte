<script>
  import ToggleGroup from "@design-system/svelte/ToggleGroup.svelte";

  let format = ["bold"];
  const formatItems = [
    { value: "bold", label: "Bold" },
    { value: "italic", label: "Italic" },
    { value: "underline", label: "Underline" },
  ];
</script>

<!-- Text formatting: styled B / I / U glyphs -->
<ToggleGroup
  items={formatItems}
  value={format}
  type="multiple"
  label="Text formatting"
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
