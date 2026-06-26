<script>
  import CodeBlock from "@design-system/svelte/CodeBlock.svelte";

  const code = `import { createCalendar } from "@design-system/svelte";

const calendar = createCalendar({
  value: "2026-06-15",
  weekStartsOn: 1,
});`;
</script>

<CodeBlock {code} language="ts" />
