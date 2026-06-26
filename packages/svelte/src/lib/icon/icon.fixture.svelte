<script lang="ts">
  import Icon from "./Icon.svelte";
  export let label: string | undefined = undefined;
  export let size = "1em";
</script>

<Icon {label} {size}>
  <polyline points="20 6 9 17 4 12" />
</Icon>
