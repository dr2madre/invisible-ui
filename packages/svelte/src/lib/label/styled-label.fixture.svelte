<script lang="ts">
  import Label from "./Label.svelte";

  interface Props {
    required?: boolean;
  }

  let { required = false }: Props = $props();
</script>

<Label for="name" {required}>Full name</Label>
<input id="name" type="text" />
