<script>
  import AvatarGroup from "@design-system/svelte/AvatarGroup.svelte";

  const items = [
    { name: "Ada Lovelace" },
    { name: "Grace Hopper" },
    { name: "Alan Turing" },
    { name: "Katherine Johnson" },
    { name: "Edsger Dijkstra" },
    { name: "Barbara Liskov" },
  ];
</script>

<AvatarGroup {items} max={4} label="Project team" />
