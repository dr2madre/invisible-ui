<script lang="ts">
  import Calendar from "./Calendar.svelte";
  import LocaleProvider from "../i18n/LocaleProvider.svelte";
  import type { WeekStart } from "./create-calendar";

  interface Props {
    locale?: string;
    weekStartsOn?: WeekStart;
  }

  let { locale = "en", weekStartsOn }: Props = $props();
</script>

<LocaleProvider {locale}>
  <Calendar label="Calendar" value="2026-06-15" {weekStartsOn} />
</LocaleProvider>
