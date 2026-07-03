<script lang="ts">
  import Icon from "./Icon.svelte";
  export let label: string | undefined = undefined;
  export let size = "1em";
  export let animation: "none" | "spin" | "pulse" = "none";
  export let animationDuration: string | undefined = undefined;
</script>

<Icon {label} {size} {animation} {animationDuration}>
  <polyline points="20 6 9 17 4 12" />
</Icon>
