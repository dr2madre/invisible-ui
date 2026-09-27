<script lang="ts">
  import { untrack } from "svelte";
  import { createButton } from "./create-button";

  interface Props {
    disabled?: boolean;
    onPress?: () => void;
  }

  let { disabled = false, onPress }: Props = $props();

  const { rootAction } = untrack(() => createButton({ disabled, onPress, nativeButton: false }));
</script>

<!-- A non-native element behaving as a button. -->
<span use:rootAction>Open</span>
