<script lang="ts">
  import Radio from "./Radio.svelte";

  interface Props {
    value?: string;
    onChange?: (value: string) => void;
  }

  let { value = "free", onChange }: Props = $props();
</script>

<Radio name="plan" value="free" checked={value === "free"} {onChange}>Free</Radio>
<Radio name="plan" value="pro" checked={value === "pro"} {onChange}>Pro</Radio>
