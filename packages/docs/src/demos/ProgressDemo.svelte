<script>
  import Progress from "@design-system/svelte/Progress.svelte";
  import Button from "@design-system/svelte/Button.svelte";

  // User-driven completion: the value advances because the user acts,
  // not because the system is working.
  const STEPS = ["Account", "Profile", "Preferences", "Review"];
  let done = 0;
</script>

<div class="demo">
  <section>
    <p class="demo__caption">Step completion — driven by the user</p>
    <div style="max-inline-size: 22rem; display: grid; gap: 0.75rem;">
      <Progress value={done} max={STEPS.length} label="Onboarding steps" />
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <Button
          onpress={() => (done = Math.min(done + 1, STEPS.length))}
          disabled={done >= STEPS.length}
        >
          {done >= STEPS.length ? "All done" : `Complete “${STEPS[done]}”`}
        </Button>
        <Button variant="ghost" onpress={() => (done = 0)} disabled={done === 0}>Reset</Button>
      </div>
      <p style="margin: 0; font-size: 0.8125rem; color: var(--ds-color-text-secondary);">
        {done} of {STEPS.length} steps completed
      </p>
    </div>
  </section>

  <section>
    <p class="demo__caption">Gamification and analytics — a value against a reference</p>
    <div style="max-inline-size: 22rem; display: grid; gap: 1rem;">
      <div>
        <Progress value={7} max={10} label="Achievements unlocked" />
        <p
          style="margin: 0.375rem 0 0; font-size: 0.8125rem; color: var(--ds-color-text-secondary);"
        >
          7 of 10 achievements
        </p>
      </div>
      <div>
        <Progress value={82} label="Profile completeness" />
        <p
          style="margin: 0.375rem 0 0; font-size: 0.8125rem; color: var(--ds-color-text-secondary);"
        >
          82% profile complete
        </p>
      </div>
    </div>
  </section>

  <section>
    <p class="demo__caption">Circle — the same value as a ring</p>
    <div style="display: flex; gap: 1rem; align-items: center;">
      <Progress shape="circle" value={68} showValue label="Yearly goal" />
      <Progress shape="circle" value={(done / STEPS.length) * 100} showValue label="Onboarding" />
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
