<script lang="ts">
  import LocaleProvider from "./LocaleProvider.svelte";
  import Carousel from "../carousel/Carousel.svelte";
  import Combobox from "../combobox/Combobox.svelte";

  const messages = {
    "carousel.choose": "Scegli slide",
    "combobox.show": "Mostra opzioni",
    "combobox.hide": "Chiudi opzioni",
  };
  const slides = [
    { title: "Uno", pastel: "#e5a1ac" },
    { title: "Due", pastel: "#b8a1e6" },
  ];
  const options = [{ value: "mela", label: "Mela" }];
</script>

<LocaleProvider locale="it" {messages}>
  <Carousel items={slides} label="Destinazioni" showIndicators />
  <Combobox label="Frutto" items={options} />
</LocaleProvider>
