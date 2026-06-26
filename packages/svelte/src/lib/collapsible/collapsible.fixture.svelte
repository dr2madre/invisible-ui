<script lang="ts">
  import { createCollapsible } from "./create-collapsible";

  export let open = false;
  export let disabled = false;

  const { rootAction, triggerAction, contentAction } = createCollapsible({
    id: "col",
    open,
    disabled,
  });
</script>

<div use:rootAction>
  <button use:triggerAction>Toggle</button>
  <div use:contentAction>Content</div>
</div>
