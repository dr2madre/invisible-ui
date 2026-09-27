<script lang="ts">
  import SheetDialog from "./SheetDialog.svelte";

  interface Props {
    open?: boolean;
    side?: "top" | "right" | "bottom" | "left";
    draggable?: boolean;
    onOpenChange?: (open: boolean) => void;
    renderTrigger?: boolean;
    returnFocusTo?: string;
  }

  let {
    open = false,
    side = "right",
    draggable = false,
    onOpenChange,
    renderTrigger = true,
    returnFocusTo,
  }: Props = $props();
</script>

<button type="button">before</button>
<SheetDialog
  {open}
  {side}
  {draggable}
  {onOpenChange}
  {renderTrigger}
  {returnFocusTo}
  title="Filters"
  description="Refine the results."
>
  {#snippet trigger()}<span>Open panel</span>{/snippet}
  <label>Query <input type="text" /></label>
  <button type="button">Apply</button>
</SheetDialog>
