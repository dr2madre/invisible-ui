<script>
  import { asyncContent } from "@design-system/core";
  import Button from "@design-system/svelte/Button.svelte";
  import EmptyState from "@design-system/svelte/EmptyState.svelte";
  import ErrorState from "@design-system/svelte/ErrorState.svelte";
  import InlineNotification from "@design-system/svelte/InlineNotification.svelte";
  import Loading from "@design-system/svelte/Loading.svelte";
  import Skeleton from "@design-system/svelte/Skeleton.svelte";

  // The application owns the request lifecycle; these buttons script it
  // deterministically (no network, no timers of our own).
  let status = "idle";
  let content = null;
  let lastResultEmpty = false;

  const startRequest = () => (status = "loading");
  const succeed = () => {
    content = ["Ada Lovelace", "Grace Hopper", "Barbara Liskov"];
    lastResultEmpty = false;
    status = "success";
  };
  const succeedEmpty = () => {
    content = [];
    lastResultEmpty = true;
    status = "success";
  };
  const fail = () => (status = "error");
  const reset = () => {
    status = "idle";
    content = null;
    lastResultEmpty = false;
  };

  $: hasContent = content !== null && content.length > 0;
  $: view = asyncContent.deriveAsyncView({ status, hasContent, isEmpty: lastResultEmpty });
</script>

<div class="async-demo">
  <div class="async-demo__controls" role="group" aria-label="Request script">
    <Button variant="secondary" onpress={startRequest}>Start request</Button>
    <Button variant="secondary" onpress={succeed}>Succeed with data</Button>
    <Button variant="secondary" onpress={succeedEmpty}>Succeed empty</Button>
    <Button variant="secondary" onpress={fail}>Fail</Button>
    <Button variant="ghost" onpress={reset}>Reset</Button>
  </div>

  <div class="async-demo__body">
    {#if view === "idle"}
      <p class="async-demo__idle">Nothing requested yet.</p>
    {:else if view === "initial-loading"}
      <!-- Skeleton sketches the layout at once; the Loading text appears only
           after its own no-flash delay. -->
      <Skeleton lines={3} />
      <Loading label="Loading people" showLabel delay={300} />
    {:else if view === "empty"}
      <EmptyState
        title="No people yet"
        description="A successful request returned nothing."
        actionLabel="Reload"
        onAction={startRequest}
      />
    {:else if view === "initial-error"}
      <ErrorState
        title="Loading failed"
        description="The request did not complete."
        actionLabel="Retry"
        onAction={startRequest}
      />
    {:else}
      <!-- content, refreshing and stale-error all keep the list mounted. -->
      {#if view === "stale-error"}
        <InlineNotification
          status="danger"
          title="Refresh failed"
          description="Showing the last loaded data."
          actions={[{ label: "Retry", onClick: startRequest }]}
        />
      {/if}
      {#if view === "refreshing"}
        <div class="async-demo__refreshing">
          <Loading label="Refreshing" showLabel />
        </div>
      {/if}
      <ul class="async-demo__list">
        {#each content ?? [] as person (person)}
          <li>{person}</li>
        {/each}
      </ul>
      <Button variant="ghost" onpress={startRequest}>Refresh</Button>
    {/if}
  </div>

  <p data-testid="async-view">View: {view}</p>
</div>

<style>
  .async-demo {
    display: grid;
    gap: 1rem;
  }
  .async-demo__controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .async-demo__body {
    display: grid;
    gap: 0.75rem;
    justify-items: start;
    min-block-size: 8rem;
    align-content: start;
  }
  /* The body grid start-justifies items; the skeleton needs real width. */
  .async-demo__body :global(.skeleton) {
    justify-self: stretch;
    max-inline-size: 16rem;
  }
  .async-demo__idle {
    margin: 0;
    color: var(--ds-color-text-secondary, #524c44);
  }
  .async-demo__list {
    margin: 0;
    padding-inline-start: 1.25rem;
  }
</style>
