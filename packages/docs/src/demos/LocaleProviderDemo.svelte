<script>
  import LocaleProvider from "@design-system/svelte/LocaleProvider.svelte";
  import Calendar from "@design-system/svelte/Calendar.svelte";

  const ar = {
    "calendar.previous": "السابق",
    "calendar.next": "التالي",
    "calendar.today": "اليوم",
    "calendar.label": "التقويم",
  };
</script>

<LocaleProvider locale="ar" dir="rtl" messages={ar}>
  <Calendar value="2026-06-15" focusedDate="2026-06-15" locale="ar-EG" />
</LocaleProvider>
