<script lang="ts">
  import { createButton } from "./create-button";

  export let disabled = false;
  export let onPress: (() => void) | undefined = undefined;

  const { rootAction } = createButton({ disabled, onPress, nativeButton: false });
</script>

<!-- A non-native element behaving as a button. -->
<span use:rootAction>Open</span>
