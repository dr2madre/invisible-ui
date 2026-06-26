<script lang="ts">
  import Label from "./Label.svelte";

  export let required = false;
</script>

<Label for="name" {required}>Full name</Label>
<input id="name" type="text" />
