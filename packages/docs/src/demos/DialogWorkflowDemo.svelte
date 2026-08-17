<script>
  // A two-step workflow composed from Dialog. The step lives here, in the
  // application: the dialog lends the regions and never learns about steps.
  import { tick } from "svelte";
  import Dialog from "@design-system/svelte/Dialog.svelte";
  import Button from "@design-system/svelte/Button.svelte";

  let step = 1;
  let heading;

  // Focus moves to the heading of the new step, so the new context is read
  // before its controls and focus never stays on a control the step removed.
  const goTo = async (next) => {
    step = next;
    await tick();
    heading?.focus();
  };
</script>

<Dialog title="Set up project" bodyLayout="stack" initialFocus=".workflow-demo__heading">
  <span slot="trigger">Set up project</span>
  <span slot="headerMeta">Step {step} of 2</span>

  <svelte:fragment slot="footerLead">
    {#if step === 2}
      <Button variant="ghost" onpress={() => goTo(1)}>Back</Button>
    {/if}
  </svelte:fragment>

  <svelte:fragment slot="footer">
    {#if step === 1}
      <Button variant="primary" onpress={() => goTo(2)}>Continue</Button>
    {:else}
      <Button variant="primary">Create project</Button>
    {/if}
  </svelte:fragment>

  <h3 class="workflow-demo__heading" tabindex="-1" bind:this={heading}>
    {step === 1 ? "Choose a template" : "Name the project"}
  </h3>

  {#if step === 1}
    <p class="workflow-demo__text">
      Every template ships the same accessible defaults. You can change all of this later.
    </p>
    <label class="workflow-demo__field">
      Template
      <select>
        <option>Empty project</option>
        <option>Component library</option>
        <option>Documentation site</option>
      </select>
    </label>
    <p class="workflow-demo__text">
      Templates differ in the files they create, never in the behaviour of the components. A
      documentation site adds pages and navigation; a component library adds a build and an entry
      point; an empty project adds neither. Pick the one closest to the work and add the rest when
      you need it. This paragraph is long enough to make the body scroll, which is the point: the
      header and the footer stay put while this region moves.
    </p>
  {:else}
    <p class="workflow-demo__text">The name appears in the workspace list and in the URL.</p>
    <label class="workflow-demo__field">
      Project name
      <input type="text" value="invisible-ui" />
    </label>
    <p class="workflow-demo__text">
      Creating the project writes a folder and a configuration file. Nothing is written before this
      step, so leaving now leaves nothing behind. When an application does apply a change earlier
      than its last step, its dismissal control has to say so.
    </p>
  {/if}
</Dialog>

<style>
  .workflow-demo__heading {
    margin: 0;
    font-size: 1rem;
  }
  .workflow-demo__heading:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
  }
  .workflow-demo__text {
    margin: 0;
    color: var(--ds-color-text-secondary);
  }
  .workflow-demo__field {
    display: grid;
    gap: 0.25rem;
  }
</style>
