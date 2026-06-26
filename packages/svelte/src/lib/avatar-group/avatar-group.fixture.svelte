<script lang="ts">
  import AvatarGroup, { type AvatarGroupItem } from "./AvatarGroup.svelte";

  export let max = 4;
  export let label = "Project team";

  const items: AvatarGroupItem[] = [
    { name: "Ada Lovelace" },
    { name: "Grace Hopper" },
    { name: "Alan Turing" },
    { name: "Katherine Johnson" },
    { name: "Edsger Dijkstra" },
    { name: "Barbara Liskov" },
  ];
</script>

<AvatarGroup {items} {max} {label} />
