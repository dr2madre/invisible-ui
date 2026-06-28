<script>
  import Select from "@design-system/svelte/Select.svelte";
</script>

<Select
  label="Fruit"
  value="banana"
  placeholder="Select a fruit…"
  items={[
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana" },
    { value: "cherry", label: "Cherry" },
  ]}
>
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
