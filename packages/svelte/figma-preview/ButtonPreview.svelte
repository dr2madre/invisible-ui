<script lang="ts">
  import Button from "../src/lib/button/Button.svelte";
  const variants = ["default", "primary", "secondary", "ghost", "danger"] as const;
  const states = ["default", "hover", "disabled"] as const;
</script>

<main>
  {#each variants as variant (variant)}
    <section aria-label={variant}>
      {#each states as state (state)}
        <div data-case={`${variant}/${state}`}>
          <Button {variant} disabled={state === "disabled"}
            >{variant === "default" ? "Button" : variant}</Button
          >
        </div>
      {/each}
    </section>
  {/each}
</main>

<style>
  :global(body) {
    margin: 32px;
    background: var(--ds-components-page-background-default);
    color: var(--ds-components-general-foreground-default);
    font:
      14px Inter,
      sans-serif;
  }
  main {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  section {
    display: flex;
    gap: 24px;
  }
</style>
