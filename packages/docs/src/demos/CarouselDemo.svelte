<script>
  import Carousel from "@design-system/svelte/Carousel.svelte";
  import Tag from "@design-system/svelte/Tag.svelte";

  // Use the provided pastel tokens (soft), not strong custom colors.
  const items = [
    { title: "Mountains", tag: "Trending", pastel: "var(--ds-pastel-teal, #7abecc)" },
    { title: "Ocean", tag: "Popular", pastel: "var(--ds-pastel-violet, #b8a1e6)" },
    { title: "Desert", tag: "New", pastel: "var(--ds-pastel-yellow, #e5cb44)" },
    { title: "Forest", tag: "Eco", pastel: "var(--ds-pastel-green, #8dcc7a)" },
    { title: "City", tag: "Hot", pastel: "var(--ds-pastel-pink, #e5a1ac)" },
  ];
</script>

<Carousel {items} variant="gallery" label="Destinations" let:item>
  <div class="slide" style="background: {item.pastel};">
    <Tag>{item.tag}</Tag>
    <span class="slide__title">{item.title}</span>
  </div>
</Carousel>

<style>
  .slide {
    min-width: 12rem;
    height: 9rem;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: space-between;
    padding: 0.75rem;
    border-radius: 0.75rem;
    /* Pastels are light → dark text reads accessibly. */
    color: var(--ds-color-text, #1c1917);
  }
  .slide__title {
    font-weight: 700;
    font-size: 1.1rem;
  }
</style>
