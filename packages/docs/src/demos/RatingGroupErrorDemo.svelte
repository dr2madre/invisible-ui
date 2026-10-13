<script>
  import RatingGroup from "@design-system/svelte/RatingGroup.svelte";
  /** @type {number | null} */
  let value = $state(null);
</script>

<!-- The app owns the error: it sets it from the value and clears it. -->
<RatingGroup
  {value}
  label="Stay rating"
  error={value === null ? "Choose a rating." : ""}
  onValueChange={(next) => (value = next)}
/>
