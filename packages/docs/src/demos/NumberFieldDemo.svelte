<script>
  import LocaleProvider from "@design-system/svelte/LocaleProvider.svelte";
  import NumberField from "@design-system/svelte/NumberField.svelte";
  import SegmentedControl from "@design-system/svelte/SegmentedControl.svelte";

  let locale = "en";
  const locales = [
    { value: "en", label: "English" },
    { value: "it-IT", label: "Italiano" },
    { value: "ar-EG", label: "العربية" },
  ];

  let quantity = 2;
  let price = 12345.5;
</script>

<div class="number-field-demo">
  <SegmentedControl
    items={locales}
    value={locale}
    label="Locale"
    onValueChange={(next) => (locale = next)}
  />

  <LocaleProvider {locale}>
    <div class="number-field-demo__fields">
      <NumberField
        label="Quantity"
        value={quantity}
        min={0}
        max={99}
        onValueChange={(next) => (quantity = next)}
      />
      <NumberField
        label="Price"
        value={price}
        min={0}
        step={0.5}
        description="Steps of 0.5, grouped display on commit."
        onValueChange={(next) => (price = next)}
      />
    </div>
  </LocaleProvider>
</div>

<style>
  .number-field-demo {
    display: grid;
    /* An auto track grows with its widest item; a bounded one lets the
       fields shrink on small screens. */
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
    justify-items: start;
  }
  .number-field-demo__fields {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
    justify-items: start;
  }
</style>
