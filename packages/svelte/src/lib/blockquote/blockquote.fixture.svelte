<script lang="ts">
  import Blockquote from "./Blockquote.svelte";

  interface Props {
    cite?: string;
    citeUrl?: string;
  }

  let { cite, citeUrl }: Props = $props();
</script>

<Blockquote {cite} {citeUrl}>Simplicity is the ultimate sophistication.</Blockquote>
