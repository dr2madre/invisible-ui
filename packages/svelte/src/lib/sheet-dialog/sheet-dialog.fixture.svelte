<script lang="ts">
  import SheetDialog from "./SheetDialog.svelte";

  export let open = false;
  export let side: "top" | "right" | "bottom" | "left" = "right";
  export let draggable = false;
  export let onOpenChange: ((open: boolean) => void) | undefined = undefined;
</script>

<button type="button">before</button>
<SheetDialog
  {open}
  {side}
  {draggable}
  {onOpenChange}
  title="Filters"
  description="Refine the results."
>
  <span slot="trigger">Open panel</span>
  <label>Query <input type="text" /></label>
  <button type="button">Apply</button>
</SheetDialog>
