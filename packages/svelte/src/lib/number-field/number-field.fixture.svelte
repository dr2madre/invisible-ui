<script lang="ts">
  import LocaleProvider from "../i18n/LocaleProvider.svelte";
  import NumberField from "./NumberField.svelte";

  interface Props {
    providerLocale?: string;
    value?: number | null;
    locale?: string;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    changeOnWheel?: boolean;
    description?: string;
    error?: string;
    onValueChange?: (value: number | null) => void;
    onValueCommit?: (value: number | null) => void;
    /** Render a sibling field to prove ids and wiring stay per-instance. */
    second?: boolean;
  }

  let {
    providerLocale = "en",
    value = null,
    locale,
    min,
    max,
    step = 1,
    disabled = false,
    readOnly = false,
    required = false,
    changeOnWheel = false,
    description,
    error,
    onValueChange,
    onValueCommit,
    second = false,
  }: Props = $props();

  // A rerender replaces the whole props object, so a plain prop read would tell
  // the field that `value` changed even when it holds the same number. The
  // derived passes on real changes only, as a parent's state would.
  const fieldValue = $derived(value);
</script>

<LocaleProvider locale={providerLocale}>
  <NumberField
    label="Amount"
    value={fieldValue}
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
