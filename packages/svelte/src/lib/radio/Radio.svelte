<script lang="ts">
  /**
   * Radio — a single styled radio button paired with its label. Built on a
   * native `<input type="radio">`, so several `Radio`s sharing the same `name`
   * form one group automatically (native keyboard, focus and form semantics);
   * use this when you want to lay out radios yourself. For a managed group with
   * roving tabindex use `RadioGroup`.
   *
   * The label is the default slot (falling back to the `label` prop). Colors are
   * themeable via `--ds-radio-*`.
   */
  import { stableId } from "../internal/stable-id";
  /** The value submitted / reported when this radio is chosen. */
  export let value: string;
  /** Group name; radios sharing a name are mutually exclusive. */
  export let name: string;
  /** Whether this radio is selected. */
  export let checked = false;
  export let disabled = false;
  /** Label text, used when the default slot is empty. */
  export let label: string | undefined = undefined;
  /** Called with this radio's value when it becomes selected. */
  export let onChange: ((value: string) => void) | undefined = undefined;

  const id = stableId("ds-radio");
</script>

<label class="radio" class:radio--disabled={disabled} for={id}>
  <input
    {id}
    class="radio__input"
    type="radio"
    {name}
    {value}
    {checked}
    {disabled}
    on:change={() => onChange?.(value)}
  />
  <span class="radio__dot" aria-hidden="true"></span>
  <span class="radio__label"><slot>{label}</slot></span>
</label>

<style>
  .radio {
    /* Anchors the hidden input: unanchored, it would sit at its static
       position outside any clipping and widen the page. */
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font: inherit;
    color: var(--ds-color-text, #282420);
    cursor: pointer;
  }
  .radio--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  /* Hide the native control but keep it focusable and in the a11y tree. */
  .radio__input {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    border: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .radio__dot {
    inline-size: var(--ds-radio-size, 1.1rem);
    block-size: var(--ds-radio-size, 1.1rem);
    border: 1px solid var(--ds-color-control-border, #757067);
    border-radius: 50%;
    display: inline-grid;
    place-content: center;
    flex: none;
  }
  /* The dot, not the edge, carries the state: the boundary keeps the control
     border, and the dot takes the selection text form, which clears 3:1 on
     the page in both themes (the base selection purple measures 2.87:1 on
     the dark page). */
  .radio__input:checked + .radio__dot {
    border-color: var(--ds-color-control-border, #757067);
  }
  .radio__input:checked + .radio__dot::after {
    content: "";
    inline-size: 0.6rem;
    block-size: 0.6rem;
    border-radius: 50%;
    background: var(--ds-color-selected-text, #553d7f);
  }
  .radio__input:focus-visible + .radio__dot {
    outline: none;
    box-shadow: var(--ds-focus-ring-shadow);
    outline-offset: 2px;
  }
</style>
