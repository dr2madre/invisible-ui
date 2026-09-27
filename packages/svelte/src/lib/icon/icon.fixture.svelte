<script lang="ts">
  import Icon from "./Icon.svelte";

  interface Props {
    label?: string;
    size?: string;
    animation?: "none" | "spin" | "pulse";
    animationDuration?: string;
  }

  let { label, size = "1em", animation = "none", animationDuration }: Props = $props();
</script>

<Icon {label} {size} {animation} {animationDuration}>
  <polyline points="20 6 9 17 4 12" />
</Icon>
