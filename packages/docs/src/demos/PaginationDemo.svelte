<script>
  import Pagination from "@design-system/svelte/Pagination.svelte";
  let page = $state(3);
</script>

<Pagination {page} pageCount={10} onPageChange={(p) => (page = p)} />
