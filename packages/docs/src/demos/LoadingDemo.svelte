<script>
  import { onMount } from "svelte";
  import Loading from "@design-system/svelte/Loading.svelte";
  import Button from "@design-system/svelte/Button.svelte";

  // Determinate card: refills forever so the "completes" behaviour stays visible.
  let progress = 0;
  onMount(() => {
    const t = setInterval(() => {
      progress = progress >= 100 ? 0 : progress + 2;
    }, 80);
    return () => clearInterval(t);
  });

  // Double download bar: the second bar tracks the current file; each time it
  // completes, the first (total) advances and the file count grows, up to 3.
  const TOTAL_FILES = 3;
  let filesDone = 0;
  let fileProgress = 0;
  let hold = 0;
  onMount(() => {
    const t = setInterval(() => {
      if (filesDone >= TOTAL_FILES) {
        // Pause at 100% so the completed state is visible, then restart.
        if (++hold > 15) {
          filesDone = 0;
          fileProgress = 0;
          hold = 0;
        }
        return;
      }
      fileProgress += 4;
      if (fileProgress >= 100) {
        filesDone += 1;
        fileProgress = 0;
      }
    }, 80);
    return () => clearInterval(t);
  });
  $: overall =
    ((filesDone + (filesDone >= TOTAL_FILES ? 0 : fileProgress / 100)) / TOTAL_FILES) * 100;
  const FILE_NAMES = ["report-january.pdf", "report-february.pdf", "report-march.pdf"];
  $: currentFile = FILE_NAMES[Math.min(filesDone, TOTAL_FILES - 1)];
</script>

<div class="demo">
  <section>
    <p class="demo__caption">Variants — dots, typing, spinner, morph</p>
    <div style="display: flex; gap: 1.25rem; align-items: center;">
      <Loading />
      <Loading variant="typing" label="Waiting for a reply" />
      <Loading variant="spinner" />
      <Loading variant="morph" />
    </div>
  </section>

  <section>
    <p class="demo__caption">With a visible label</p>
    <Loading showLabel label="Loading results" />
  </section>

  <section>
    <p class="demo__caption">In buttons</p>
    <div style="display: flex; gap: 0.5rem; align-items: center;">
      <Button variant="primary">
        <svelte:fragment slot="left"><Loading variant="morph" decorative /></svelte:fragment>
        Saving…
      </Button>
      <Button variant="danger" loading>Deleting…</Button>
    </div>
  </section>

  <section>
    <p class="demo__caption">Bar — label and percentage</p>
    <div style="max-inline-size: 20rem;">
      <Loading variant="bar" value={progress} showLabel showValue label="Downloading" />
    </div>
  </section>

  <section>
    <p class="demo__caption">Double bar — multi-file download</p>
    <div style="max-inline-size: 20rem; display: flex; flex-direction: column; gap: 0.75rem;">
      <Loading
        variant="bar"
        value={overall}
        showLabel
        label="Downloading"
        detail="{filesDone} of {TOTAL_FILES} files"
      />
      <Loading
        variant="bar"
        value={filesDone >= TOTAL_FILES ? 100 : fileProgress}
        showLabel
        label={currentFile}
        detail="{(((filesDone >= TOTAL_FILES ? 100 : fileProgress) / 100) * 4.6).toFixed(
          1,
        )} MB of 4.6 MB"
      />
    </div>
  </section>

  <section>
    <p class="demo__caption">Overlay pattern — busy region</p>
    <div
      aria-busy="true"
      style="position: relative; inline-size: 16rem; border: 1px solid var(--ds-color-border); border-radius: 0.75rem; overflow: hidden;"
    >
      <div style="padding: 1rem;">
        <p style="margin: 0; font-weight: 600;">Team activity</p>
        <p style="margin: 0.25rem 0 0; color: var(--ds-color-text-secondary);">
          12 updates this week
        </p>
      </div>
      <div
        style="position: absolute; inset: 0; display: grid; place-items: center; background: color-mix(in srgb, var(--ds-color-background) 65%, transparent); color: var(--ds-color-primary);"
      >
        <Loading variant="typing" label="Reloading section" />
      </div>
    </div>
  </section>

  <section>
    <p class="demo__caption">Bar at the top of a card — indeterminate and determinate</p>
    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
      <div
        style="inline-size: 16rem; border: 1px solid var(--ds-color-border); border-radius: 0.75rem; overflow: hidden;"
      >
        <span style="display: block; color: var(--ds-color-primary);">
          <Loading variant="bar" label="Refreshing card" />
        </span>
        <div style="padding: 1rem;">
          <p style="margin: 0; font-weight: 600;">Monthly report</p>
          <p style="margin: 0.25rem 0 0; color: var(--ds-color-text-secondary);">
            Refreshing data…
          </p>
        </div>
      </div>
      <div
        style="inline-size: 16rem; border: 1px solid var(--ds-color-border); border-radius: 0.75rem; overflow: hidden;"
      >
        <span style="display: block; color: var(--ds-color-primary);">
          <Loading variant="bar" value={progress} label="Downloading report" />
        </span>
        <div style="padding: 1rem;">
          <p style="margin: 0; font-weight: 600;">Monthly report</p>
          <p
            style="margin: 0.25rem 0 0; color: var(--ds-color-text-secondary); font-variant-numeric: tabular-nums;"
          >
            Downloading… {((progress / 100) * 128).toFixed(1)} MB of 128 MB
          </p>
        </div>
      </div>
    </div>
  </section>
</div>

<style>
  .demo {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
    inline-size: 100%;
  }
  .demo__caption {
    margin: 0 0 0.625rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ds-color-text-secondary, #57534e);
  }
</style>
