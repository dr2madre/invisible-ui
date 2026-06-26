<script lang="ts">
  import AspectRatio from "./AspectRatio.svelte";

  export let ratio = 1;
</script>

<AspectRatio {ratio}>
  <img src="/example.jpg" alt="Example media" />
</AspectRatio>
