<script>
  import LocaleProvider from "@invisible-ui/svelte/LocaleProvider.svelte";
  import Calendar from "@invisible-ui/svelte/Calendar.svelte";
  import Combobox from "@invisible-ui/svelte/Combobox.svelte";
  import TextField from "@invisible-ui/svelte/TextField.svelte";
  import SegmentedControl from "@invisible-ui/svelte/SegmentedControl.svelte";

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

  let locale = $state("en");
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
    /* An auto track grows with its widest item; a bounded one lets the
       calendar shrink on small screens. */
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
    justify-items: start;
  }
  .locale-demo__content {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
    justify-items: start;
  }
</style>
