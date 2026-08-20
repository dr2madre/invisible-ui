<script lang="ts">
  import LocaleProvider from "../i18n/LocaleProvider.svelte";
  import NumberField from "./NumberField.svelte";

  export let providerLocale = "en";
  export let value: number | null = null;
  export let locale: string | undefined = undefined;
  export let min: number | undefined = undefined;
  export let max: number | undefined = undefined;
  export let step = 1;
  export let disabled = false;
  export let readOnly = false;
  export let required = false;
  export let changeOnWheel = false;
  export let description: string | undefined = undefined;
  export let error: string | undefined = undefined;
  export let onValueChange: ((value: number | null) => void) | undefined = undefined;
  export let onValueCommit: ((value: number | null) => void) | undefined = undefined;
  /** Render a sibling field to prove ids and wiring stay per-instance. */
  export let second = false;
</script>

<LocaleProvider locale={providerLocale}>
  <NumberField
    label="Amount"
    {value}
    {locale}
    {min}
    {max}
    {step}
    {disabled}
    {readOnly}
    {required}
    {changeOnWheel}
    {description}
    {error}
    {onValueChange}
    {onValueCommit}
  />
  {#if second}
    <NumberField label="Other" />
  {/if}
</LocaleProvider>
