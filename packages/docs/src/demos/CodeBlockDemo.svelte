<script>
  import CodeBlock from "@invisible-ui/svelte/CodeBlock.svelte";

  const code = `import { createCalendar } from "@invisible-ui/svelte";

const calendar = createCalendar({
  value: "2026-06-15",
  weekStartsOn: 1,
});`;
</script>

<CodeBlock {code} language="ts" />
