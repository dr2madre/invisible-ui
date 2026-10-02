<script lang="ts">
  import RatingGroup from "./RatingGroup.svelte";

  interface Props {
    value?: number | null;
    max?: number;
    disabled?: boolean;
    onValueChange?: (value: number) => void;
  }

  let { value = null, max = 5, disabled = false, onValueChange }: Props = $props();
</script>

<RatingGroup label="Rating" {value} {max} {disabled} {onValueChange} />
