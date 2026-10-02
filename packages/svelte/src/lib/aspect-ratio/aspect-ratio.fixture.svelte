<script lang="ts">
  import AspectRatio from "./AspectRatio.svelte";

  interface Props {
    ratio?: number;
  }

  let { ratio = 1 }: Props = $props();
</script>

<AspectRatio {ratio}>
  <img src="/example.jpg" alt="Example media" />
</AspectRatio>
