<script lang="ts">
  import UploadDropArea from "./UploadDropArea.svelte";

  interface Props {
    accept?: string;
    multiple?: boolean;
    disabled?: boolean;
    onFiles?: (files: File[]) => void;
  }

  let { accept, multiple = false, disabled = false, onFiles }: Props = $props();
</script>

<UploadDropArea {accept} {multiple} {disabled} {onFiles} />
