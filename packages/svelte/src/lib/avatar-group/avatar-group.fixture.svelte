<script lang="ts">
  import AvatarGroup, { type AvatarGroupItem } from "./AvatarGroup.svelte";

  interface Props {
    max?: number;
    label?: string;
    items?: AvatarGroupItem[];
  }

  let {
    max = 4,
    label = "Project team",
    items = [
      { name: "Ada Lovelace" },
      { name: "Grace Hopper" },
      { name: "Alan Turing" },
      { name: "Katherine Johnson" },
      { name: "Edsger Dijkstra" },
      { name: "Barbara Liskov" },
    ],
  }: Props = $props();
</script>

<AvatarGroup {items} {max} {label} />
