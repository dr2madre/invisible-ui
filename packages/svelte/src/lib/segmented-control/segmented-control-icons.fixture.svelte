<script lang="ts">
  import SegmentedControl from "./SegmentedControl.svelte";
  import Icon from "../icon/Icon.svelte";

  interface Props {
    value?: string | null;
    iconOnly?: boolean;
    stacked?: boolean;
    orientation?: "horizontal" | "vertical";
    onValueChange?: (value: string) => void;
  }

  let {
    value = "list",
    iconOnly = true,
    stacked = false,
    orientation = "horizontal",
    onValueChange,
  }: Props = $props();

  const items = [
    { value: "list", label: "List", icon: Icon },
    { value: "board", label: "Board", icon: Icon },
    { value: "calendar", label: "Calendar", icon: Icon },
  ];
</script>

<SegmentedControl label="View" {items} {value} {iconOnly} {stacked} {orientation} {onValueChange} />
