<script>
  import Combobox from "@design-system/svelte/Combobox.svelte";

  const people = [
    { value: "ada", label: "Ada Lovelace" },
    { value: "grace", label: "Grace Hopper" },
    { value: "hedy", label: "Hedy Lamarr" },
    { value: "katherine", label: "Katherine Johnson" },
    { value: "margaret", label: "Margaret Hamilton" },
    { value: "radia", label: "Radia Perlman" },
  ];
</script>

<div style="display: grid; gap: 1.5rem;">
  <!-- Search configuration: type-to-filter over a list. -->
  <figure style="margin: 0; display: grid; gap: 0.5rem; justify-items: start;">
    <Combobox label="Assignee" items={people} placeholder="Search people…" />
    <figcaption style="font-size: 0.8125rem; color: var(--ds-color-text-secondary);">
      <strong>Search</strong> — the editable combobox: typing filters the options.
    </figcaption>
  </figure>

  <!-- Advanced-select configuration: no search, styled popup, per-option
       icons — the control mirrors the selected option's icon. -->
  <figure style="margin: 0; display: grid; gap: 0.5rem; justify-items: start;">
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
    <figcaption style="font-size: 0.8125rem; color: var(--ds-color-text-secondary);">
      <strong>Advanced select</strong> — <code>searchable={"{false}"}</code>: a read-only trigger,
      styled popup and per-option icons, for what the native
      <a href="/invisible-ui/components/forms/select/">Select</a> can't render.
    </figcaption>
  </figure>
</div>
