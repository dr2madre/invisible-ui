<script lang="ts">
  import Radio from "./Radio.svelte";

  export let value = "free";
  export let onChange: ((value: string) => void) | undefined = undefined;
</script>

<Radio name="plan" value="free" checked={value === "free"} {onChange}>Free</Radio>
<Radio name="plan" value="pro" checked={value === "pro"} {onChange}>Pro</Radio>
