<script lang="ts">
  // A two-step workflow composed from Dialog. The step lives here, in the
  // application: the dialog only lends the regions and never learns about steps.
  import { tick } from "svelte";
  import Dialog from "./Dialog.svelte";
  import Button from "../button/Button.svelte";

  interface Props {
    open?: boolean;
    step?: 1 | 2;
  }

  let { open = false, step = 1 }: Props = $props();

  let heading: HTMLHeadingElement | undefined = $state();

  // Focus lands on the new step heading, so the reader hears the new context
  // before its controls, and never stays on a control the step removed.
  const goTo = async (next: 1 | 2) => {
    step = next;
    await tick();
    heading?.focus();
  };
</script>

<Dialog {open} title="Set up project" bodyLayout="stack" footerClose closeLabel="Close">
  {#snippet trigger()}<span>Set up project</span>{/snippet}
  {#snippet headerMeta()}<span>Step {step} of 2</span>{/snippet}

  {#snippet footerLead()}
    {#if step === 2}
      <Button variant="ghost" onpress={() => goTo(1)}>Back</Button>
    {/if}
  {/snippet}

  {#snippet footer()}
    {#if step === 1}
      <Button variant="primary" onpress={() => goTo(2)}>Continue</Button>
    {:else}
      <Button variant="primary">Create project</Button>
    {/if}
  {/snippet}

  <h3 tabindex="-1" bind:this={heading}>
    {step === 1 ? "Choose a template" : "Name the project"}
  </h3>
  {#if step === 1}
    <label>Template <input type="text" /></label>
  {:else}
    <label>Project name <input type="text" /></label>
  {/if}
</Dialog>
