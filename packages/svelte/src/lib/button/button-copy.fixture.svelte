<script lang="ts">
  import Button from "./Button.svelte";
  import LocaleProvider from "../i18n/LocaleProvider.svelte";

  interface Props {
    copy?: string;
    copiedLabel?: string;
    /** Catalog overrides; set, the button sits in an Italian locale provider. */
    messages?: Record<string, string>;
  }

  let { copy, copiedLabel, messages }: Props = $props();
</script>

{#if messages}
  <LocaleProvider locale="it" {messages}>
    <Button {copy} {copiedLabel}>Copia link</Button>
  </LocaleProvider>
{:else}
  <Button {copy} {copiedLabel}>Copy link</Button>
{/if}
