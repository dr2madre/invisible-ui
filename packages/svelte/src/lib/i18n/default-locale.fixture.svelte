<script lang="ts">
  import Calendar from "../calendar/Calendar.svelte";
  import TimeField from "../time-field/TimeField.svelte";
  import LocaleProvider from "./LocaleProvider.svelte";
  import Probe from "./locale-probe.fixture.svelte";

  let { locale }: { locale?: string } = $props();
</script>

{#snippet fields()}
  <Probe />
  <Calendar value="2026-06-15" focusedDate="2026-06-15" />
  <TimeField value="21:30" label="Time" />
{/snippet}

{#if locale}
  <LocaleProvider {locale}>{@render fields()}</LocaleProvider>
{:else}
  {@render fields()}
{/if}
