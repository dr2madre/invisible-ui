<script>
  import Avatar from "@design-system/svelte/Avatar.svelte";

  // A repository-owned image: a remote photo service made the visual
  // baseline depend on the network.
  const portrait = `${import.meta.env.BASE_URL}demo/portrait.svg`;
</script>

<Avatar name="Ada Lovelace" />
<Avatar name="Grace Hopper" src={portrait} />
<Avatar name="Alan Turing" shape="square" />
<Avatar name="Ada Lovelace" size="lg" />
