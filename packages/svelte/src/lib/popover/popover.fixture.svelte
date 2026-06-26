<script lang="ts">
  import Popover from "./Popover.svelte";
  export let onOpenChange: ((open: boolean) => void) | undefined = undefined;
</script>

<button>before</button>
<Popover {onOpenChange}>
  <span slot="trigger">Open popover</span>
  <p>Popover body</p>
  <button class="inside">Action</button>
</Popover>
<button>after</button>
