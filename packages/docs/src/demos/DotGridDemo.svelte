<script>
  import { onMount } from "svelte";
  import DotGrid from "@design-system/svelte/DotGrid.svelte";
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
    <DotGrid label="Generating image" status={STEPS[step]} />
  </div>

  <!-- Percentage + file count in a bottom label zone. -->
  <div style={box}>
    <DotGrid
      labelPosition="bottom"
      status="Uploading"
      value={pct}
      detail="{Math.min(8, Math.ceil((pct / 100) * 8))} of 8 files"
    />
  </div>

  <!-- Add an explicit indicator (spinner) via the indicator slot. -->
  <div style={box}>
    <DotGrid label="Loading">
      <Loading slot="indicator" variant="spinner" decorative />
    </DotGrid>
  </div>

  <!-- When loading ends, the default slot's content renders in place. -->
  <div style={box}>
    <DotGrid {loading} status="Rendering preview">
      <div
        style="display: grid; place-items: center; block-size: 100%; padding: 1rem; text-align: center;"
      >
        <div>
          <p style="margin: 0; font-weight: 700;">Monthly report</p>
          <p style="margin: 0.25rem 0 0; color: var(--ds-color-text-secondary);">
            Ready — rendered content shown here.
          </p>
        </div>
      </div>
    </DotGrid>
  </div>
</div>
