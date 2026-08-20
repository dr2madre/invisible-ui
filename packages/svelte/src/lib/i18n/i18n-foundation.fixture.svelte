<script lang="ts">
  import LocaleProvider from "./LocaleProvider.svelte";
  import Calendar from "../calendar/Calendar.svelte";
  import Combobox from "../combobox/Combobox.svelte";
  import RatingGroup from "../rating-group/RatingGroup.svelte";
  import TextField from "../text-field/TextField.svelte";
  import type { Dir } from "./create-i18n";
  import type { Messages } from "./messages";

  export let locale = "en";
  export let dir: Dir | undefined = undefined;
  export let messages: Messages = {};
  export let calendarLocale: string | undefined = undefined;
  export let onValueChange: ((value: string | null) => void) | undefined = undefined;
  export let nestedLocale: string | undefined = undefined;
</script>

<LocaleProvider {locale} {dir} {messages}>
  <Calendar value="2026-01-15" focusedDate="2026-01-15" locale={calendarLocale} {onValueChange} />
  <RatingGroup label="Rating" value={1} max={3} />
  <TextField label="Notes" />
  <Combobox label="Fruit" items={[{ value: "apple", label: "Apple" }]} />
  {#if nestedLocale}
    <LocaleProvider locale={nestedLocale}>
      <span data-testid="nested-probe"><RatingGroup label="Nested rating" value={2} max={3} /></span
      >
      <Combobox label="Nested fruit" items={[{ value: "fig", label: "Fig" }]} />
    </LocaleProvider>
  {/if}
</LocaleProvider>
