<script lang="ts">
  import RatingGroup from "./RatingGroup.svelte";

  export let value: number | null = null;
  export let max = 5;
  export let disabled = false;
  export let onValueChange: ((value: number) => void) | undefined = undefined;
</script>

<RatingGroup label="Rating" {value} {max} {disabled} {onValueChange} />
