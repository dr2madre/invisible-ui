<script lang="ts">
  import { untrack } from "svelte";
  import { createButton } from "./create-button";

  interface Props {
    disabled?: boolean;
    onPress?: () => void;
  }

  let { disabled = false, onPress }: Props = $props();

  const { rootAction } = untrack(() => createButton({ disabled, onPress }));
</script>

<button use:rootAction>Save</button>
