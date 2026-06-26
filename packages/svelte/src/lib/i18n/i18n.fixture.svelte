<script lang="ts">
  import LocaleProvider from "./LocaleProvider.svelte";
  import Calendar from "../calendar/Calendar.svelte";
  import type { Dir } from "./create-i18n";

  export let dir: Dir = "rtl";

  const messages = {
    "calendar.previous": "Indietro",
    "calendar.next": "Avanti",
    "calendar.today": "Oggi",
    "calendar.label": "Calendario",
  };
</script>

<LocaleProvider locale="it" {dir} {messages}>
  <Calendar value="2026-06-15" focusedDate="2026-06-15" locale="it" />
</LocaleProvider>
