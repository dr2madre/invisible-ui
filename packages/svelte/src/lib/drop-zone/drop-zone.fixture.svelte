<script lang="ts">
  import DropZone from "./DropZone.svelte";

  export let accept: string | undefined = undefined;
  export let multiple = false;
  export let disabled = false;
  export let onFiles: ((files: File[]) => void) | undefined = undefined;
</script>

<DropZone {accept} {multiple} {disabled} {onFiles} />
