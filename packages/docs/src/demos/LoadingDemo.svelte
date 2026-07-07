<script>
  import { onMount } from "svelte";
  import Loading from "@design-system/svelte/Loading.svelte";
  import Button from "@design-system/svelte/Button.svelte";

  // No-flash delay + overlay-without-veil: a fake ~1.2s task. Loading is mounted
  // immediately but only appears after its own 150ms delay, so a quick task
  // would never flash it.
  let busy = false;
  function runTask() {
    busy = true;
    setTimeout(() => (busy = false), 1200);
  }

  // Live status: a succession of steps as a backend would report them. Each new
  // message is announced (polite + atomic), not just shown.
  const STEPS = ["Connecting…", "Authenticating…", "Fetching records…", "Rendering…"];
  let step = 0;
  onMount(() => {
    const t = setInterval(() => (step = (step + 1) % STEPS.length), 1400);
    return () => clearInterval(t);
  });
  $: currentStatus = STEPS[step];
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
    <p class="demo__caption">Live status — steps reported by the backend</p>
    <Loading variant="spinner" status={currentStatus} />
  </section>

  <section>
    <p class="demo__caption">In buttons — including successive steps via loadingStatus</p>
    <div style="display: flex; gap: 0.5rem; align-items: center;">
      <Button variant="primary">
        <svelte:fragment slot="left"><Loading variant="morph" decorative /></svelte:fragment>
        Saving…
      </Button>
      <Button variant="danger" loading>Deleting…</Button>
      <Button loading loadingStatus={currentStatus}>Sync</Button>
    </div>
  </section>

  <section>
    <p class="demo__caption">Overlay pattern — busy region (built-in overlay + veil)</p>
    <div
      aria-busy="true"
      style="position: relative; inline-size: 16rem; border: 1px solid var(--ds-color-border); border-radius: 0.75rem; overflow: hidden; color: var(--ds-color-primary);"
    >
      <div style="padding: 1rem; color: var(--ds-color-text);">
        <p style="margin: 0; font-weight: 600;">Team activity</p>
        <p style="margin: 0.25rem 0 0; color: var(--ds-color-text-secondary);">
          12 updates this week
        </p>
      </div>
      <!-- `overlay` fills this positioned box; `veil` (default) dims + blocks it. -->
      <Loading variant="typing" overlay label="Reloading section" />
    </div>
  </section>

  <section>
    <p class="demo__caption">Overlay without veil + no-flash delay (the UploadDropArea pattern)</p>
    <p
      style="margin: -0.25rem 0 0.625rem; font-size: 0.8125rem; color: var(--ds-color-text-secondary);"
    >
      Press it: the spinner appears only after 150 ms, so a fast action never flashes one.
    </p>
    <div
      aria-busy={busy}
      style="position: relative; inline-size: 16rem; display: flex; justify-content: center; padding: 1.25rem; border: 1px solid var(--ds-color-border); border-radius: 0.75rem; color: var(--ds-color-secondary);"
    >
      <Button variant="primary" onpress={runTask}>Run a ~1.2s task</Button>
      {#if busy}
        <Loading variant="spinner" overlay veil={false} delay={150} decorative />
      {/if}
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
