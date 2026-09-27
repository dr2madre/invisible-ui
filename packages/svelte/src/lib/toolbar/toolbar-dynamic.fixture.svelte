<script lang="ts">
  import Toolbar from "./Toolbar.svelte";

  interface Props {
    italicDisabled?: boolean;
    showItalic?: boolean;
    showUnderline?: boolean;
  }

  let { italicDisabled = false, showItalic = true, showUnderline = false }: Props = $props();
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
