<script>
  import Pagination from "@invisible-ui/svelte/Pagination.svelte";
  let page = $state(3);
</script>

<Pagination {page} pageCount={10} onPageChange={(p) => (page = p)} />
