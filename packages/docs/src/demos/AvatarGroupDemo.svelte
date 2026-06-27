<script>
  import AvatarGroup from "@design-system/svelte/AvatarGroup.svelte";

  // A palette of soft greens around the brand primary (#8DCC7A) so each avatar
  // reads as a distinct person while staying on-brand.
  const items = [
    { name: "Ada Lovelace", color: "#e5a1ac" },
    { name: "Grace Hopper", color: "#b8a1e6" },
    { name: "Alan Turing", color: "#7abecc" },
    { name: "Katherine Johnson", color: "#8dcc7a" },
    { name: "Edsger Dijkstra", color: "#e5cb44" },
    { name: "Barbara Liskov", color: "#b8a1e6" },
  ];
</script>

<div class="avatar-group-demo">
  <AvatarGroup {items} max={4} label="Project team" />
</div>

<style>
  /* Dark initials so they read on the light green tints. */
  .avatar-group-demo {
    --ds-avatar-color: #14532d;
  }
</style>
