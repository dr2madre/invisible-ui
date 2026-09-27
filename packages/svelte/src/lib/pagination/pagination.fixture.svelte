<script lang="ts">
  import { untrack } from "svelte";
  import { createPagination } from "./create-pagination";

  interface Props {
    page?: number;
    pageCount?: number;
    onPageChange?: (page: number) => void;
  }

  let { page = 1, pageCount = 5, onPageChange }: Props = $props();

  const { rootAction, prevAction, nextAction, pageAction, items } = untrack(() =>
    createPagination({ page, pageCount, onPageChange }),
  );
</script>

<nav use:rootAction aria-label="Pagination">
  <button use:prevAction aria-label="Go to previous page">prev</button>
  {#each $items as item, i (typeof item === "number" ? `p${item}` : `e${i}`)}
    {#if item === "ellipsis"}
      <span aria-hidden="true">…</span>
    {:else}
      <button use:pageAction={item} aria-label={`Go to page ${item}`}>{item}</button>
    {/if}
  {/each}
  <button use:nextAction aria-label="Go to next page">next</button>
</nav>
