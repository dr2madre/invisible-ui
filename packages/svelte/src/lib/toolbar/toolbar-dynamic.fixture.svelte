<script lang="ts">
  import Toolbar from "./Toolbar.svelte";

  export let italicDisabled = false;
  export let showItalic = true;
  export let showUnderline = false;
</script>

<Toolbar label="Text formatting">
  <button type="button">Bold</button>
  {#if showItalic}
    <button type="button" disabled={italicDisabled}>Italic</button>
  {/if}
  {#if showUnderline}
    <button type="button">Underline</button>
  {/if}
  <button type="button">Align left</button>
</Toolbar>
