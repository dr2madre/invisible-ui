<script lang="ts">
  import Popover from "./Popover.svelte";

  export let openDelay = 0;
  export let closeDelay = 0;
  export let onOpenChange: ((open: boolean) => void) | undefined = undefined;
</script>

<a href="#before">before</a>
<Popover trigger="hover" {openDelay} {closeDelay} {onOpenChange}>
  <a slot="trigger" href="#ada">@ada</a>
  <div>
    <strong>Ada Lovelace</strong>
    <p>Mathematician, the first programmer.</p>
    <a href="#follow">Follow</a>
  </div>
</Popover>
<a href="#after">after</a>
