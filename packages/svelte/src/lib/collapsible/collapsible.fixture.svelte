<script lang="ts">
  import { untrack } from "svelte";
  import { createCollapsible } from "./create-collapsible";

  interface Props {
    open?: boolean;
    disabled?: boolean;
  }

  let { open = false, disabled = false }: Props = $props();

  // Seeded once from the first props.
  const { rootAction, triggerAction, contentAction } = untrack(() =>
    createCollapsible({
      id: "col",
      open,
      disabled,
    }),
  );
</script>

<div use:rootAction>
  <button use:triggerAction>Toggle</button>
  <div use:contentAction>Content</div>
</div>
