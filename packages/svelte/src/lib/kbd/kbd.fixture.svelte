<script lang="ts">
  import Kbd from "./Kbd.svelte";

  export let keys: string[] | undefined = undefined;
  export let separator = "+";
</script>

{#if keys}
  <Kbd {keys} {separator} />
{:else}
  <Kbd>Esc</Kbd>
{/if}
