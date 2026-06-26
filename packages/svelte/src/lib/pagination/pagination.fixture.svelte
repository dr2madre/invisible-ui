<script lang="ts">
  import { createPagination } from "./create-pagination";

  export let page = 1;
  export let pageCount = 5;
  export let onPageChange: ((page: number) => void) | undefined = undefined;

  const { rootAction, prevAction, nextAction, pageAction, items } = createPagination({
    page,
    pageCount,
    onPageChange,
  });
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
