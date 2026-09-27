<script lang="ts">
  import Popover from "./Popover.svelte";

  interface Props {
    openDelay?: number;
    closeDelay?: number;
    onOpenChange?: (open: boolean) => void;
  }

  let { openDelay = 0, closeDelay = 0, onOpenChange }: Props = $props();
</script>

<a href="#before">before</a>
<Popover trigger="hover" {openDelay} {closeDelay} {onOpenChange}>
  {#snippet triggerContent()}<a href="#ada">@ada</a>{/snippet}
  <!-- Supplementary preview: nothing focusable inside. -->
  <div>
    <strong>Ada Lovelace</strong>
    <p>Mathematician, the first programmer.</p>
  </div>
</Popover>
<a href="#after">after</a>
