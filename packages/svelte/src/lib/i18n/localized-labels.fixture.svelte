<script lang="ts">
  import LocaleProvider from "./LocaleProvider.svelte";
  import Pagination from "../pagination/Pagination.svelte";
  import RatingGroup from "../rating-group/RatingGroup.svelte";
  import PinInput from "../pin-input/PinInput.svelte";

  const messages = {
    "pagination.previous": "Pagina precedente",
    "pagination.next": "Pagina successiva",
    "pagination.page": "Vai a pagina {page}",
    "rating.star": "{count} stella",
    "rating.stars": "{count} stelle",
    "pinInput.cell": "Carattere {index} di {length}",
  };
</script>

<LocaleProvider locale="it" {messages}>
  <Pagination page={1} pageCount={3} />
  <RatingGroup label="Voto" max={3} />
  <PinInput label="Codice" length={4} />
</LocaleProvider>
