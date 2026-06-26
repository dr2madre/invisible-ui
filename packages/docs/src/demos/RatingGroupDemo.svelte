<script>
  import RatingGroup from "@design-system/svelte/RatingGroup.svelte";
  let value = 3;
</script>

<RatingGroup {value} max={5} label="Rating" onValueChange={(v) => (value = v)} />
