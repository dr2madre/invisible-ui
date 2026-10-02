<script lang="ts">
  import Kbd from "./Kbd.svelte";

  interface Props {
    keys?: string[];
    separator?: string;
  }

  let { keys, separator = "+" }: Props = $props();
</script>

{#if keys}
  <Kbd {keys} {separator} />
{:else}
  <Kbd>Esc</Kbd>
{/if}
