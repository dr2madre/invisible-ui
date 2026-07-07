<script lang="ts">
  import UploadDropArea from "./UploadDropArea.svelte";

  export let accept: string | undefined = undefined;
  export let multiple = false;
  export let disabled = false;
  export let onFiles: ((files: File[]) => void) | undefined = undefined;
</script>

<UploadDropArea {accept} {multiple} {disabled} {onFiles} />
