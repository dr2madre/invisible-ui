<script lang="ts">
  import Carousel, { type CarouselSlide } from "./Carousel.svelte";

  interface Props {
    variant?: "slide" | "gallery";
    loop?: boolean;
    orientation?: "horizontal" | "vertical";
    items?: CarouselSlide[];
  }

  let {
    variant = "slide",
    loop = false,
    orientation = "horizontal",
    items = [
      { image: "https://example.com/1.jpg", title: "Peaks", description: "Above the clouds." },
      { image: "https://example.com/2.jpg", title: "Valley", description: "Down by the river." },
      { image: "https://example.com/3.jpg", title: "Forest", description: "Among the pines." },
    ],
  }: Props = $props();
</script>

{#if variant === "gallery"}
  <Carousel {items} variant="gallery" {loop} label="Album gallery">
    {#snippet children({ item, index })}
      <article class="album">
        <span class="album__cover">{index + 1}</span>
        <span class="album__title">{item.title}</span>
      </article>
    {/snippet}
  </Carousel>
{:else}
  <Carousel {items} variant="slide" {loop} {orientation} label="Featured photos" />
{/if}

<style>
  .album {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .album__cover {
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    background: #ddd;
    border-radius: 0.5rem;
  }
</style>
