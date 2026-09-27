<script lang="ts">
  import LocaleProvider from "./LocaleProvider.svelte";
  import Calendar from "../calendar/Calendar.svelte";
  import Combobox from "../combobox/Combobox.svelte";
  import RatingGroup from "../rating-group/RatingGroup.svelte";
  import TextField from "../text-field/TextField.svelte";
  import type { Dir } from "./create-i18n";
  import type { Messages } from "./messages";

  interface Props {
    locale?: string;
    dir?: Dir;
    messages?: Messages;
    calendarLocale?: string;
    onValueChange?: (value: string | null) => void;
    nestedLocale?: string;
  }

  let {
    locale = "en",
    dir,
    messages = {},
    calendarLocale,
    onValueChange,
    nestedLocale,
  }: Props = $props();
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
