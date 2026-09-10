<script lang="ts">
  /**
   * The reset contract, live (ADR 0012): the library form restores its current
   * defaults exactly as the native form beside it does, reports nothing, and a
   * consumer can replace the whole restore by cancelling the reset event.
   */
  import Button from "@design-system/svelte/Button.svelte";
  import Checkbox from "@design-system/svelte/Checkbox.svelte";
  import Select from "@design-system/svelte/Select.svelte";
  import Switch from "@design-system/svelte/Switch.svelte";
  import TextField from "@design-system/svelte/TextField.svelte";
  import PinInput from "@design-system/svelte/PinInput.svelte";

  const fruit = [
    { value: "apple", label: "Apple" },
    { value: "pear", label: "Pear" },
  ];

  // The one notification the contract gives a consumer: the form's own reset
  // event. It arrives before the browser restores anything.
  let resets = 0;
  let reports = 0;
  let blockResets = false;

  const onReset = (event: Event) => {
    resets += 1;
    if (blockResets) event.preventDefault();
  };
  const report = () => {
    reports += 1;
  };
</script>

<div class="form-reset-demo">
  <form data-testid="library-form" on:reset={onReset}>
    <h3>Library form</h3>
    <TextField label="Name" name="name" value="Ada" onValueChange={report} />
    <Checkbox label="Subscribe" name="subscribe" checked onCheckedChange={report} />
    <Switch label="Notifications" name="notify" checked={false} onCheckedChange={report} />
    <Select label="Fruit" name="fruit" value="pear" items={fruit} onValueChange={report} />
    <PinInput label="Code" name="pin" length={4} value="1234" onValueChange={report} />
    <div class="form-reset-demo__row">
      <Button type="reset">Reset the form</Button>
      <Checkbox
        label="Cancel every reset"
        checked={blockResets}
        onCheckedChange={(next) => (blockResets = next === true)}
      />
    </div>
  </form>

  <form data-testid="native-form">
    <h3>Native reference</h3>
    <label>Name <input type="text" name="name" value="Ada" /></label>
    <label><input type="checkbox" name="subscribe" checked /> Subscribe</label>
    <label
      >Fruit
      <select name="fruit">
        <option value="apple">Apple</option>
        <option value="pear" selected>Pear</option>
      </select></label
    >
    <div class="form-reset-demo__row">
      <button type="reset" class="form-reset-demo__native-reset">Reset the form</button>
    </div>
  </form>

  <p class="form-reset-demo__status" data-testid="reset-status">
    Reset events seen: {resets}. Change callbacks fired: {reports}.
  </p>
</div>

<style>
  .form-reset-demo {
    /* The fields fill their column instead of holding an 18rem floor open:
       an implicit grid column is as wide as its widest item's minimum. */
    --ds-field-width: 100%;
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr));
    color: var(--ds-color-text, #282420);
  }
  .form-reset-demo form {
    display: grid;
    gap: 0.75rem;
    align-content: start;
    /* A grid item's default minimum is its content: without this the fixed
       field width would hold the whole column open past a narrow viewport. */
    min-inline-size: 0;
  }
  .form-reset-demo h3 {
    margin: 0;
  }
  .form-reset-demo__row {
    display: grid;
    grid-auto-flow: column;
    justify-content: start;
    align-items: center;
    gap: 1rem;
  }
  .form-reset-demo label {
    display: grid;
    gap: 0.25rem;
    justify-items: start;
  }
  /* The native reference must reflow like the library beside it, and keep a
     boundary a forced-colors palette can draw. */
  .form-reset-demo input,
  .form-reset-demo select {
    max-inline-size: 100%;
    box-sizing: border-box;
    border: 1px solid var(--ds-color-control-border, #757067);
    border-radius: var(--ds-radius-control, 0.5rem);
    padding: 0.35rem 0.5rem;
    font: inherit;
    background: var(--ds-color-background, #fff);
    color: inherit;
  }
  .form-reset-demo input[type="checkbox"] {
    inline-size: 1.5rem;
    block-size: 1.5rem;
    padding: 0;
  }
  /* The native glyph stays; the palette needs an edge it is allowed to draw. */
  @media (forced-colors: active) {
    .form-reset-demo input[type="checkbox"] {
      outline: 1px solid CanvasText;
      outline-offset: -1px;
    }
  }
  .form-reset-demo__native-reset {
    min-block-size: 2.25rem;
    padding: 0.4rem 0.9rem;
    font: inherit;
    color: var(--ds-color-text, #282420);
    background: var(--ds-color-surface, #e6e0d8);
    border: 1px solid var(--ds-color-control-border, #757067);
    border-radius: var(--ds-radius-control, 0.5rem);
    cursor: pointer;
  }
  .form-reset-demo__status {
    grid-column: 1 / -1;
    margin: 0;
  }
</style>
