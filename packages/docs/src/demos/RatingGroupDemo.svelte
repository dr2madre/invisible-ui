<script>
  import RatingGroup from "@nozcadesign/invisible-ui-svelte/RatingGroup.svelte";
  let value = $state(3);
</script>

<RatingGroup {value} max={5} label="Rating" onValueChange={(v) => (value = v)} />
