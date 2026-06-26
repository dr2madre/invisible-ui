<script lang="ts">
  import Blockquote from "./Blockquote.svelte";

  export let cite: string | undefined = undefined;
  export let citeUrl: string | undefined = undefined;
</script>

<Blockquote {cite} {citeUrl}>Simplicity is the ultimate sophistication.</Blockquote>
