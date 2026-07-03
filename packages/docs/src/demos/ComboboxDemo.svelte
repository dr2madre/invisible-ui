<script>
  import Combobox from "@design-system/svelte/Combobox.svelte";

  const items = [
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana" },
    { value: "blueberry", label: "Blueberry" },
    { value: "cherry", label: "Cherry" },
    { value: "grape", label: "Grape" },
  ];
</script>

<div style="display: flex; flex-direction: column; gap: 1rem;">
  <!-- Editable autocomplete: typing filters the options. -->
  <Combobox label="Fruit" {items} />

  <!-- The advanced select: no search, styled popup, per-option icons — the
       control mirrors the selected option's icon. -->
  <Combobox
    label="Priority"
    searchable={false}
    width="wrap"
    value="high"
    placeholder="Set a priority…"
    items={[
      { value: "high", label: "High", icon: "M12 19V5m-7 7 7-7 7 7" },
      { value: "normal", label: "Normal", icon: "M5 12h14m-7-7 7 7-7 7" },
      { value: "low", label: "Low", icon: "M12 5v14m7-7-7 7-7-7" },
    ]}
  />
</div>
