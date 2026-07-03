<script>
  import Select from "@design-system/svelte/Select.svelte";

  const fruits = [
    { value: "apple", label: "Apple" },
    { value: "banana", label: "Banana" },
    { value: "cherry", label: "Cherry", disabled: true },
  ];
</script>

<div style="display: flex; flex-direction: column; gap: 1rem; inline-size: 100%;">
  <!-- width="wrap" (default): the native select fits its longest option. -->
  <Select label="Fruit" value="banana" placeholder="Select a fruit…" items={fruits} />

  <!-- width="fill": 100% of the container. -->
  <Select label="Team" width="fill" placeholder="Assign to…" items={fruits} />

  <!-- width="fixed": --ds-select-width (16rem by default). -->
  <Select label="Country" width="fixed" placeholder="Choose a country…" items={fruits} />

  <!-- Required + invalid: native validation, aria-invalid and the announced message. -->
  <Select
    label="Payment method"
    required
    error="Choose a payment method to continue"
    placeholder="Choose…"
    items={[
      { value: "card", label: "Credit card" },
      { value: "paypal", label: "PayPal" },
      { value: "transfer", label: "Bank transfer" },
    ]}
  />
</div>
