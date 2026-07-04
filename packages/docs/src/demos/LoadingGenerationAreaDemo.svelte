<script>
  import { onMount } from "svelte";
  import LoadingGenerationArea from "@design-system/svelte/LoadingGenerationArea.svelte";
  import Loading from "@design-system/svelte/Loading.svelte";

  const STEPS = ["Connecting…", "Fetching records…", "Rendering…"];
  let step = 0;
  let pct = 0;
  onMount(() => {
    const t = setInterval(() => {
      step = (step + 1) % STEPS.length;
      pct = pct >= 100 ? 0 : pct + 4;
    }, 700);
    return () => clearInterval(t);
  });

  // Reveal demo: load for ~2.6s, show the content for a beat, then loop.
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

  <!-- Percentage + file count in a bottom label zone. -->
  <div style={box}>
    <LoadingGenerationArea
      labelPosition="bottom"
      status="Uploading"
      value={pct}
      detail="{Math.min(8, Math.ceil((pct / 100) * 8))} of 8 files"
    />
  </div>

  <!-- No dot field (field={false}): a plain loading area with an explicit
       indicator via the slot — the dot field would be redundant here. -->
  <div style={box}>
    <LoadingGenerationArea field={false} label="Loading">
      <Loading slot="indicator" variant="spinner" decorative />
    </LoadingGenerationArea>
  </div>

  <!-- The typical case: an image is being generated. While loading, the dot
       field; when done, the generated image renders in its place. -->
  <div style={box}>
    <LoadingGenerationArea {loading} status="Generating image">
      <img
        src="{import.meta.env.BASE_URL}dot-grid-sample.png"
        alt="Generated landscape"
        style="inline-size: 100%; block-size: 100%; object-fit: cover; display: block;"
      />
    </LoadingGenerationArea>
  </div>
</div>
