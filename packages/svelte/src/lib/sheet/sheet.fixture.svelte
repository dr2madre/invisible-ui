<script lang="ts">
  import Sheet from "./Sheet.svelte";

  export let open = false;
  export let side: "top" | "right" | "bottom" | "left" = "right";
  export let onOpenChange: ((open: boolean) => void) | undefined = undefined;
</script>

<button type="button">before</button>
<Sheet {open} {side} {onOpenChange} title="Filters" description="Refine the results.">
  <span slot="trigger">Open sheet</span>
  <label>Query <input type="text" /></label>
  <button type="button">Apply</button>
</Sheet>
