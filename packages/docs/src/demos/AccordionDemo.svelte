<script>
  import Accordion from "@design-system/svelte/Accordion.svelte";
</script>

<Accordion
  value={["shipping"]}
  items={[
    {
      value: "shipping",
      label: "Shipping",
      content: "We ship worldwide within 3–5 business days.",
    },
    { value: "returns", label: "Returns", content: "Return any item within 30 days." },
  ]}
/>
