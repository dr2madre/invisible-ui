<script lang="ts">
  import SegmentedControl from "./SegmentedControl.svelte";
  import Icon from "../icon/Icon.svelte";

  export let value: string | null = "list";
  export let iconOnly = true;
  export let stacked = false;
  export let orientation: "horizontal" | "vertical" = "horizontal";
  export let onValueChange: ((value: string) => void) | undefined = undefined;

  const items = [
    { value: "list", label: "List", icon: Icon },
    { value: "board", label: "Board", icon: Icon },
    { value: "calendar", label: "Calendar", icon: Icon },
  ];
</script>

<SegmentedControl label="View" {items} {value} {iconOnly} {stacked} {orientation} {onValueChange} />
