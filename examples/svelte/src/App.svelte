<script lang="ts">
  import {
    createAccordion,
    createButton,
    createCheckbox,
    createRadioGroup,
    createSegmentedControl,
    createSwitch,
    createTabs,
    createToggleButton,
  } from "@design-system/svelte";
  import FeedbackIcon from "@design-system/svelte/FeedbackIcon.svelte";
  import Icon from "@design-system/svelte/Icon.svelte";
  import { createNotifier } from "@design-system/svelte";
  import Button from "@design-system/svelte/Button.svelte";
  import InlineNotification from "@design-system/svelte/InlineNotification.svelte";
  import NotificationRegion from "@design-system/svelte/NotificationRegion.svelte";
  import TextField from "@design-system/svelte/TextField.svelte";
  import Textarea from "@design-system/svelte/Textarea.svelte";
  import ButtonGroup from "@design-system/svelte/ButtonGroup.svelte";
  import Select from "@design-system/svelte/Select.svelte";
  import CheckboxGroup from "@design-system/svelte/CheckboxGroup.svelte";

  const notifier = createNotifier();
  let noticeCount = 0;

  let theme: "light" | "dark" = "light";
  $: if (typeof document !== "undefined") document.documentElement.dataset.theme = theme;

  const feedbackStatuses = ["info", "success", "warning", "danger", "neutral"] as const;
  let closableShown = true;

  // The library ships behaviour + accessibility only. All styling below is
  // ours, attached through the data-* hooks the headless primitives expose.
  let count = 0;
  const { rootAction: buttonAction } = createButton({
    onPress: () => (count += 1),
  });

  // A non-native element (here a <span>) behaving as a real button.
  const { rootAction: linkButtonAction } = createButton({
    nativeButton: false,
    onPress: () => (count += 1),
  });

  const { rootAction: checkboxAction, state: checkboxState } = createCheckbox({
    checked: "indeterminate",
  });

  const { rootAction: switchAction, state: switchState } = createSwitch();

  // Toggle buttons (on/off buttons), e.g. a text-formatting toolbar.
  const { rootAction: boldAction, state: boldState } = createToggleButton();
  const { rootAction: italicAction } = createToggleButton();

  const sizes = [{ value: "small" }, { value: "medium" }, { value: "large" }];
  const {
    rootAction: radioAction,
    itemAction: radioItem,
    value: size,
  } = createRadioGroup({ items: sizes, value: "medium" });

  const views = [{ value: "list" }, { value: "board" }, { value: "calendar" }];
  const {
    rootAction: segAction,
    itemAction: segItem,
    value: view,
  } = createSegmentedControl({ items: views, value: "list" });

  const tabItems = [{ value: "account" }, { value: "password" }, { value: "team" }];
  const {
    rootAction: tabsAction,
    tabAction,
    panelAction,
  } = createTabs({
    items: tabItems,
    value: "account",
  });

  const faqItems = [{ value: "shipping" }, { value: "returns" }, { value: "support" }];
  const acc = createAccordion({ items: faqItems, value: ["shipping"] });
</script>

<main>
  <section>
    <h2>Theme</h2>
    <div class="row">
      <Button onpress={() => (theme = theme === "light" ? "dark" : "light")}>
        Switch to {theme === "light" ? "dark" : "light"}
      </Button>
      <span>current: {theme}</span>
    </div>
  </section>

  <section>
    <h2>Feedback icon</h2>
    <div class="row">
      {#each feedbackStatuses as status (status)}
        <FeedbackIcon {status} label={status} />
      {/each}
    </div>
  </section>

  <section>
    <h2>Inline Notification</h2>
    <div class="alerts">
      <InlineNotification
        status="success"
        title="Saved"
        description="Your changes have been saved successfully."
        href="/changes"
        linkText="View changes"
      />
      <InlineNotification
        status="danger"
        title="Payment failed"
        description="We couldn't process your card. Please try a different payment method."
        closable
        role="alert"
      >
        <svelte:fragment slot="actions">
          <Button variant="primary">Retry</Button>
          <Button variant="ghost">Cancel</Button>
        </svelte:fragment>
      </InlineNotification>
    </div>
  </section>

  <section>
    <h2>Notification</h2>
    <div class="row">
      <Button
        variant="primary"
        leftIcon
        onpress={() =>
          notifier.show({
            status: "success",
            title: "Saved",
            text: `Notification #${++noticeCount} — auto-dismisses in 5s.`,
            duration: 5000,
          })}
      >
        Show notice
      </Button>
      <Button
        onpress={() =>
          notifier.show({
            status: "info",
            title: "File deleted",
            actions: [
              {
                label: "Undo",
                variant: "primary",
                onClick: () => notifier.show({ status: "success", title: "Restored" }),
              },
            ],
          })}
      >
        With action
      </Button>
      <Button
        onpress={() =>
          notifier.promise(new Promise((res) => setTimeout(res, 1500)), {
            loading: "Uploading…",
            success: "Uploaded",
            error: "Upload failed",
          })}
      >
        Promise notice
      </Button>
      <Button
        onpress={() =>
          notifier.show({
            status: "info",
            title: "Back online",
            inverted: true,
          })}
      >
        Inverted notice
      </Button>
      <Button variant="ghost" onpress={() => notifier.clear()}>Clear all</Button>
    </div>
  </section>

  <section>
    <h2>Close button</h2>
    {#if closableShown}
      <div class="row dismissible">
        <FeedbackIcon status="info" />
        <span>Dismiss me with the ghost close button.</span>
        <Button
          iconOnly
          variant="ghost"
          ariaLabel="Dismiss"
          onpress={() => (closableShown = false)}
        >
          <Icon><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></Icon>
        </Button>
      </div>
    {:else}
      <button class="reset" on:click={() => (closableShown = true)}>Reset</button>
    {/if}
  </section>

  <section>
    <h2>Button variants</h2>
    <div class="row">
      <Button onpress={() => (count += 1)}>Default</Button>
      <Button variant="primary" onpress={() => (count += 1)}>Primary</Button>
      <Button variant="secondary" onpress={() => (count += 1)}>Secondary</Button>
      <Button variant="ghost" onpress={() => (count += 1)}>Ghost</Button>
      <Button variant="danger" onpress={() => (count += 1)}>Delete</Button>
    </div>
    <div class="row">
      <Button leftIcon onpress={() => (count += 1)}>Add item</Button>
      <Button variant="ghost" rightIcon onpress={() => (count += 1)}>More</Button>
    </div>
    <p>pressed {count} times</p>
  </section>

  <section>
    <h2>Button group</h2>
    <div class="row">
      <ButtonGroup label="Text alignment">
        <Button>Left</Button>
        <Button>Center</Button>
        <Button>Right</Button>
      </ButtonGroup>
    </div>
    <div class="row">
      <ButtonGroup label="Document actions" attached={false}>
        <Button variant="primary" leftIcon>Save</Button>
        <Button variant="ghost">Cancel</Button>
      </ButtonGroup>
    </div>
  </section>

  <section>
    <h2>Headless button</h2>
    <button class="btn" use:buttonAction>Native button</button>
    <span class="btn" use:linkButtonAction>Span as button</span>
  </section>

  <section>
    <h2>Checkbox</h2>
    <!-- Custom (role=checkbox) controls aren't labelable by <label for>, so the
         visible text is bound as the name with aria-labelledby — the ARIA
         equivalent of for/id, always present and tied to what the user sees. -->
    <span class="field">
      <span class="checkbox" use:checkboxAction aria-labelledby="cb-accept"></span>
      <span id="cb-accept">Accept terms</span>
    </span>
    <p>state: {$checkboxState.checked}</p>
  </section>

  <section>
    <h2>Toggle button</h2>
    <div class="toolbar" role="toolbar" aria-label="Text formatting">
      <button class="toggle" use:boldAction aria-label="Bold"><strong>B</strong></button>
      <button class="toggle" use:italicAction aria-label="Italic"><em>I</em></button>
    </div>
    <p>bold: {$boldState.pressed}</p>
  </section>

  <section>
    <h2>Switch</h2>
    <span class="field">
      <button class="switch" use:switchAction aria-labelledby="switch-wifi"></button>
      <span id="switch-wifi">Wi-Fi</span>
    </span>
    <p>on: {$switchState.checked}</p>
  </section>

  <section>
    <h2>Select</h2>
    <Select
      label="Favorite fruit"
      placeholder="Select a fruit…"
      items={[
        { value: "apple", label: "Apple" },
        { value: "banana", label: "Banana" },
        { value: "cherry", label: "Cherry", disabled: true },
        { value: "date", label: "Date" },
        { value: "elderberry", label: "Elderberry" },
      ]}
    />
  </section>

  <section>
    <h2>Text field</h2>
    <div class="fields">
      <TextField label="Full name" placeholder="Jane Doe" />
      <TextField
        label="Email"
        type="email"
        placeholder="you@example.com"
        description="We'll never share it."
      />
      <TextField
        label="Email"
        type="email"
        value="not-an-email"
        error="Enter a valid email address."
      />
      <Textarea label="Message" placeholder="Write your message…" />
    </div>
  </section>

  <section>
    <h2>Radio group</h2>
    <div class="radiogroup" use:radioAction aria-label="Size">
      {#each sizes as item (item.value)}
        <span class="radio" use:radioItem={item.value}>
          <span class="dot"></span>
          {item.value}
        </span>
      {/each}
    </div>
    <p>size: {$size}</p>
  </section>

  <section>
    <h2>Checkbox group</h2>
    <CheckboxGroup
      label="Notifications"
      value={["email"]}
      items={[
        { value: "email", label: "Email" },
        { value: "sms", label: "SMS" },
        { value: "push", label: "Push", disabled: true },
        { value: "slack", label: "Slack" },
      ]}
    />
  </section>

  <section>
    <h2>Segmented control</h2>
    <div class="segmented" use:segAction aria-label="View">
      {#each views as item (item.value)}
        <span class="segment" use:segItem={item.value}>{item.value}</span>
      {/each}
    </div>
    <p>view: {$view}</p>
  </section>

  <section>
    <h2>Tabs</h2>
    <div class="tabs">
      <div class="tablist" use:tabsAction aria-label="Settings">
        {#each tabItems as item (item.value)}
          <button class="tab" use:tabAction={item.value}>{item.value}</button>
        {/each}
      </div>
      {#each tabItems as item (item.value)}
        <div class="panel" use:panelAction={item.value}>
          {item.value} settings
        </div>
      {/each}
    </div>
  </section>

  <section>
    <h2>Accordion</h2>
    <div class="accordion" use:acc.rootAction>
      {#each faqItems as item (item.value)}
        <div class="acc-item" use:acc.itemAction={item.value}>
          <h3 class="acc-heading">
            <button class="acc-trigger" use:acc.triggerAction={item.value}>
              {item.value}
              <span class="acc-icon" aria-hidden="true">▸</span>
            </button>
          </h3>
          <div class="acc-panel" use:acc.panelAction={item.value}>
            Info about {item.value}.
          </div>
        </div>
      {/each}
    </div>
  </section>
</main>

<NotificationRegion {notifier} placement="top-end" />

<style>
  main {
    font-family: var(--ds-font-sans);
    display: grid;
    gap: 2rem;
    place-content: center;
    min-height: 100dvh;
    /* Page surface follows the active theme so the demo (and the inverted
       notice's contrast) reads correctly in both light and dark. The background
       role token already remaps per theme — no manual dark override needed. */
    background: var(--ds-color-background, #ffffff);
    color: var(--ds-color-text, #0f172a);
  }

  section {
    display: grid;
    gap: 0.5rem;
    justify-items: start;
  }

  .row {
    display: inline-flex;
    gap: 0.5rem;
    align-items: center;
  }

  .alerts {
    display: grid;
    gap: 0.75rem;
    max-inline-size: 28rem;
  }

  .fields {
    display: grid;
    gap: 1rem;
  }

  .dismissible {
    gap: 0.75rem;
    padding: 0.25rem 0.25rem 0.25rem 0.75rem;
    border: 1px solid var(--ds-color-border);
    border-radius: var(--ds-radius-surface);
  }

  /* Styling is driven entirely by the hooks the headless primitives expose.
     Every value below maps to a role/state token, so the whole demo flips with
     the theme — no hardcoded hex, no per-component dark override. Selected
     states use the primary accent (white label reads in both themes). */
  .toolbar {
    display: inline-flex;
    gap: 0.25rem;
  }
  .toggle {
    inline-size: 2.25rem;
    block-size: 2.25rem;
    border: 1px solid var(--ds-color-border);
    border-radius: var(--ds-radius-control);
    background: var(--ds-color-background);
    color: var(--ds-color-text);
    cursor: pointer;
    font-size: 1rem;
  }
  .toggle:global([data-state="on"]) {
    background: var(--ds-color-primary);
    color: var(--ds-color-on-primary);
    border-color: var(--ds-color-primary);
  }

  .btn {
    display: inline-block;
    padding: 0.5rem 1rem;
    border: 1px solid var(--ds-color-primary);
    border-radius: var(--ds-radius-control);
    background: var(--ds-color-primary);
    color: var(--ds-color-on-primary);
    cursor: pointer;
    font: inherit;
  }

  .field {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .checkbox {
    inline-size: 1.25rem;
    block-size: 1.25rem;
    border: 1px solid var(--ds-color-border);
    border-radius: var(--ds-radius-control);
    background: var(--ds-color-background);
    display: inline-grid;
    place-content: center;
    color: var(--ds-color-on-primary);
  }

  .checkbox:global([data-state="checked"]) {
    background: var(--ds-color-primary);
    border-color: var(--ds-color-primary);
  }
  .checkbox:global([data-state="checked"])::after {
    content: "✓";
    font-size: 0.85rem;
  }

  .checkbox:global([data-state="indeterminate"]) {
    background: var(--ds-color-primary);
    border-color: var(--ds-color-primary);
  }
  .checkbox:global([data-state="indeterminate"])::after {
    content: "–";
    font-size: 0.85rem;
  }

  /* Switch — a sliding track + thumb driven by data-state. */
  .switch {
    inline-size: 2.5rem;
    block-size: 1.5rem;
    border: none;
    border-radius: var(--ds-radius-pill);
    background: var(--ds-color-border);
    position: relative;
    cursor: pointer;
    padding: 0;
  }
  .switch::after {
    content: "";
    position: absolute;
    inset-block-start: 0.125rem;
    inset-inline-start: 0.125rem;
    inline-size: 1.25rem;
    block-size: 1.25rem;
    border-radius: 50%;
    background: var(--ds-color-on-primary);
    transition: translate 0.15s;
  }
  .switch:global([data-state="checked"]) {
    background: var(--ds-color-primary);
  }
  .switch:global([data-state="checked"])::after {
    translate: 1rem 0;
  }

  /* Radio group — vertical list with a dot indicator. */
  .radiogroup {
    display: grid;
    gap: 0.5rem;
  }
  .radio {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }
  .radio .dot {
    inline-size: 1.1rem;
    block-size: 1.1rem;
    border: 1px solid var(--ds-color-border);
    border-radius: 50%;
    display: inline-grid;
    place-content: center;
  }
  .radio:global([data-state="checked"]) .dot::after {
    content: "";
    inline-size: 0.6rem;
    block-size: 0.6rem;
    border-radius: 50%;
    background: var(--ds-color-primary);
  }
  .radio:global(:focus-visible) {
    outline: 2px solid var(--ds-color-focus-ring);
    outline-offset: 2px;
  }

  /* Segmented control — a horizontal bar of segments. */
  .segmented {
    display: inline-flex;
    border: 1px solid var(--ds-color-border);
    border-radius: var(--ds-radius-control);
    overflow: hidden;
  }
  .segment {
    padding: 0.4rem 0.9rem;
    cursor: pointer;
    border-inline-start: 1px solid var(--ds-color-border);
  }
  .segment:first-child {
    border-inline-start: none;
  }
  .segment:global([data-state="checked"]) {
    background: var(--ds-color-primary);
    color: var(--ds-color-on-primary);
  }

  /* Tabs — a tab list with an underline indicator and panels. */
  .tablist {
    display: inline-flex;
    gap: 0.25rem;
    border-block-end: 1px solid var(--ds-color-border);
  }
  .tab {
    padding: 0.4rem 0.8rem;
    border: none;
    background: none;
    cursor: pointer;
    font: inherit;
    color: var(--ds-color-text-secondary);
    border-block-end: 2px solid transparent;
    margin-block-end: -1px;
  }
  .tab:global([data-state="active"]) {
    color: var(--ds-color-primary);
    border-block-end-color: var(--ds-color-primary);
  }
  .tab:global(:focus-visible) {
    outline: 2px solid var(--ds-color-focus-ring);
    outline-offset: 2px;
  }
  .panel {
    padding-block: 0.75rem;
  }

  /* Accordion — bordered items with a rotating chevron. */
  .accordion {
    inline-size: 16rem;
    border: 1px solid var(--ds-color-border);
    border-radius: var(--ds-radius-control);
    overflow: hidden;
  }
  .acc-item + .acc-item {
    border-block-start: 1px solid var(--ds-color-border);
  }
  .acc-heading {
    margin: 0;
    font-size: 1rem;
  }
  .acc-trigger {
    inline-size: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.6rem 0.8rem;
    border: none;
    background: none;
    font: inherit;
    cursor: pointer;
    text-transform: capitalize;
  }
  .acc-icon {
    transition: rotate 0.15s;
  }
  .acc-trigger:global([data-state="open"]) .acc-icon {
    rotate: 90deg;
  }
  .acc-trigger:global(:focus-visible) {
    outline: 2px solid var(--ds-color-focus-ring);
    outline-offset: -2px;
  }
  .acc-panel {
    padding: 0 0.8rem 0.8rem;
  }

  /* The primitives set these at runtime, so the attribute must be :global. */
  .toggle:global([data-disabled]),
  .btn:global([data-disabled]),
  .checkbox:global([data-disabled]),
  .switch:global([data-disabled]),
  .radio:global([data-disabled]),
  .segment:global([data-disabled]) {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
