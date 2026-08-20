<script>
  import LocaleProvider from "@design-system/svelte/LocaleProvider.svelte";
  import Calendar from "@design-system/svelte/Calendar.svelte";
  import Combobox from "@design-system/svelte/Combobox.svelte";
  import TextField from "@design-system/svelte/TextField.svelte";
  import SegmentedControl from "@design-system/svelte/SegmentedControl.svelte";

  // Translated labels per locale; direction derives from the locale itself.
  const messages = {
    "it-IT": {
      "calendar.previous": "Precedente",
      "calendar.next": "Successivo",
      "calendar.today": "Oggi",
      "combobox.placeholder": "Cerca…",
    },
    "ar-EG": {
      "calendar.previous": "السابق",
      "calendar.next": "التالي",
      "calendar.today": "اليوم",
      "combobox.placeholder": "ابحث…",
    },
  };

  let locale = "en";
  const locales = [
    { value: "en", label: "English" },
    { value: "it-IT", label: "Italiano" },
    { value: "ar-EG", label: "العربية" },
  ];

  const fruits = [
    { value: "apple", label: "Apple" },
    { value: "fig", label: "Fig" },
    { value: "pear", label: "Pear" },
  ];
</script>

<div class="locale-demo">
  <SegmentedControl
    items={locales}
    value={locale}
    label="Locale"
    onValueChange={(next) => (locale = next)}
  />

  <LocaleProvider {locale} messages={messages[locale] ?? {}}>
    <div class="locale-demo__content">
      <Calendar value="2026-06-15" focusedDate="2026-06-15" />
      <TextField label="Notes" />
      <Combobox label="Fruit" items={fruits} />
    </div>
  </LocaleProvider>
</div>

<style>
  .locale-demo {
    display: grid;
    gap: 1rem;
    justify-items: start;
  }
  .locale-demo__content {
    display: grid;
    gap: 1rem;
    justify-items: start;
  }
</style>
