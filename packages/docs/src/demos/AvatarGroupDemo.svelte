<script>
  import AvatarGroup from "@design-system/svelte/AvatarGroup.svelte";

  // A palette of soft greens around the brand primary (#8DCC7A) so each avatar
  // reads as a distinct person while staying on-brand.
  const items = [
    { name: "Ada Lovelace", color: "#8dcc7a" },
    { name: "Grace Hopper", color: "#a7d99b" },
    { name: "Alan Turing", color: "#7ac9a8" },
    { name: "Katherine Johnson", color: "#c2d98f" },
    { name: "Edsger Dijkstra", color: "#9bd4c4" },
    { name: "Barbara Liskov", color: "#b6cc7a" },
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
