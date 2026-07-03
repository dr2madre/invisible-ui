<script>
  import Select from "@design-system/svelte/Select.svelte";

  const fruits = [
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana" },
    { value: "cherry", label: "Cherry" },
  ];
</script>

<div style="display: flex; flex-direction: column; gap: 1rem; inline-size: 100%;">
  <!-- width="wrap" (default): as wide as the longest option. -->
  <Select label="Fruit" value="banana" placeholder="Select a fruit…" items={fruits}>
    <!-- A generic shopping basket — doesn't depict any single option (apple/
       banana/cherry), just "produce". -->
    <svg
      slot="icon"
      viewBox="0 0 24 24"
      width="100%"
      height="100%"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="m5 11 4-7" />
      <path d="m19 11-4-7" />
      <path d="M2 11h20" />
      <path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.6-7.4" />
      <path d="m9 11 1 9" />
      <path d="M4.5 15.5h15" />
      <path d="m15 11-1 9" />
    </svg>
  </Select>

  <!-- width="fill": 100% of the container. -->
  <Select label="Team" width="fill" placeholder="Assign to…" items={fruits} />

  <!-- width="fixed": --ds-select-width (16rem by default). -->
  <Select label="Country" width="fixed" placeholder="Choose a country…" items={fruits} />
</div>
