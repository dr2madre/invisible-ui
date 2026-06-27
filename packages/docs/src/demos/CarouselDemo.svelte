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

<div style="display: flex; flex-direction: column; gap: 2.5rem;">
  <!-- Slide: full-bleed slides with an overlaid title (built-in rendering). -->
  <Carousel
    variant="slide"
    label="Featured (slide)"
    items={[
      { title: "Mountains", description: "Trending this week" },
      { title: "Ocean", description: "Popular" },
      { title: "Desert", description: "New" },
    ]}
  />

  <!-- Gallery: a scrolling row of cards. -->
  <Carousel {items} variant="gallery" label="Destinations" let:item>
    <div class="slide" style="background: {item.pastel};">
      <Tag>{item.tag}</Tag>
      <span class="slide__title">{item.title}</span>
    </div>
  </Carousel>

  <!-- Coverflow ("jukebox"): the active card is centered, neighbors recede. -->
  <Carousel {items} variant="coverflow" label="Featured destinations" let:item let:active>
    <div class="cover" style="background: {item.pastel};" data-active={active ? "" : undefined}>
      <span class="slide__title">{item.title}</span>
    </div>
  </Carousel>

  <!-- Vertical coverflow. -->
  <Carousel
    {items}
    variant="coverflow"
    orientation="vertical"
    label="Featured destinations (vertical)"
    let:item
  >
    <div class="cover" style="background: {item.pastel};">
      <span class="slide__title">{item.title}</span>
    </div>
  </Carousel>
</div>

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
  .cover {
    inline-size: 100%;
    aspect-ratio: 1;
    box-sizing: border-box;
    display: flex;
    align-items: flex-end;
    padding: 0.75rem;
    border-radius: 0.75rem;
    color: var(--ds-color-text, #1c1917);
  }
</style>
