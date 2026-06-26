<script lang="ts">
  import { createButton } from "./create-button";

  export let disabled = false;
  export let onPress: (() => void) | undefined = undefined;

  const { rootAction } = createButton({ disabled, onPress });
</script>

<button use:rootAction>Save</button>
