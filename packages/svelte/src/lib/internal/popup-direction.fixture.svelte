<script lang="ts">
  import DropdownMenu from "../dropdown-menu/DropdownMenu.svelte";
  import Tooltip from "../tooltip/Tooltip.svelte";

  interface Props {
    dir: "ltr" | "rtl";
  }

  let { dir }: Props = $props();
</script>

<!-- A plain wrapper sets the direction; there is no locale provider. -->
<div {dir} data-testid="wrapper">
  <DropdownMenu label="Actions" items={[{ value: "copy", label: "Copy" }]} />
  <Tooltip text="Help"><button type="button">Info</button></Tooltip>
</div>
