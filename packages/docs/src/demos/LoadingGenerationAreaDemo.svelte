<script>
  import { onMount } from "svelte";
  import LoadingGenerationArea from "@design-system/svelte/LoadingGenerationArea.svelte";
  import logoLight from "../assets/logo.svg";
  import logoDark from "../assets/logo-white.svg";

  const STEPS = ["Connecting…", "Composing…", "Rendering…"];
  let step = 0;
  let files = 0;
  onMount(() => {
    const t = setInterval(() => {
      step = (step + 1) % STEPS.length;
      files = files >= 8 ? 1 : files + 1;
    }, 700);
    return () => clearInterval(t);
  });

  // Reveal demo: generate for ~2.6s, show the result for a beat, then loop.
  let loading = true;
  onMount(() => {
    const t = setInterval(() => (loading = !loading), 2600);
    return () => clearInterval(t);
  });

  const box =
    "position: relative; inline-size: 100%; max-inline-size: 26rem; aspect-ratio: 16 / 10; border: 1px solid var(--ds-color-border); border-radius: 0.75rem; overflow: hidden; color: var(--ds-color-text);";
</script>

<div style="display: flex; flex-direction: column; gap: 1.5rem; inline-size: 100%;">
  <!-- Centered live status. -->
  <div style={box}>
    <LoadingGenerationArea label="Generating image" status={STEPS[step]} />
  </div>

  <!-- A file count in a bottom label zone — no percentage (it's often unknown
       while generating/rendering). -->
  <div style={box}>
    <LoadingGenerationArea labelPosition="bottom" status="Rendering" detail="{files} of 8 files" />
  </div>

  <!-- When generation ends, the result renders in place — here the (theme-aware)
       header logo stands in for the generated image. -->
  <div style={box}>
    <LoadingGenerationArea {loading} status="Generating image">
      <div class="gen-result">
        <img class="gen-result__img gen-result__img--light" src={logoLight} alt="Generated image" />
        <img class="gen-result__img gen-result__img--dark" src={logoDark} alt="Generated image" />
      </div>
    </LoadingGenerationArea>
  </div>
</div>

<style>
  .gen-result {
    display: grid;
    place-items: center;
    block-size: 100%;
    padding: 2rem;
  }
  .gen-result__img {
    max-inline-size: 60%;
    max-block-size: 100%;
    object-fit: contain;
  }
  /* Show the logo that matches the theme — the same light/dark swap as the header. */
  .gen-result__img--dark {
    display: none;
  }
  @media (prefers-color-scheme: dark) {
    .gen-result__img--light {
      display: none;
    }
    .gen-result__img--dark {
      display: block;
    }
  }
  :global([data-theme="light"]) .gen-result__img--light {
    display: block;
  }
  :global([data-theme="light"]) .gen-result__img--dark {
    display: none;
  }
  :global([data-theme="dark"]) .gen-result__img--light {
    display: none;
  }
  :global([data-theme="dark"]) .gen-result__img--dark {
    display: block;
  }
</style>
