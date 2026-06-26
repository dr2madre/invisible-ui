<script>
  import Carousel from "@design-system/svelte/Carousel.svelte";

  const items = [
    { title: "Mountains", tone: "#1e3a8a" },
    { title: "Ocean", tone: "#0f766e" },
    { title: "Desert", tone: "#b45309" },
    { title: "Forest", tone: "#166534" },
    { title: "City", tone: "#6d28d9" },
  ];
</script>

<Carousel {items} variant="gallery" label="Destinations" let:item>
  <div
    style="min-width: 12rem; height: 8rem; border-radius: 0.75rem; display: flex; align-items: flex-end; padding: 0.75rem; color: #fff; font-weight: 600; background: {item.tone};"
  >
    {item.title}
  </div>
</Carousel>
