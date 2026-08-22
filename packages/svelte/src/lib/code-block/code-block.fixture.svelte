<script lang="ts">
  import CodeBlock from "./CodeBlock.svelte";

  export let language: string | undefined = undefined;
  export let copyable = true;
  export let code = "pnpm install\npnpm build";
</script>

<CodeBlock {language} {copyable} {code} />
