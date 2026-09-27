<script lang="ts">
  import CodeBlock from "./CodeBlock.svelte";

  interface Props {
    language?: string;
    copyable?: boolean;
    code?: string;
  }

  let { language, copyable = true, code = "pnpm install\npnpm build" }: Props = $props();
</script>

<CodeBlock {language} {copyable} {code} />
