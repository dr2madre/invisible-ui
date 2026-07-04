<script lang="ts">
  import ErrorState from "./ErrorState.svelte";

  export let onAction: (() => void) | undefined = undefined;
</script>

<ErrorState
  title="Couldn't connect to the server"
  description="An unknown error occurred."
  actionLabel="Try again"
  {onAction}
/>
